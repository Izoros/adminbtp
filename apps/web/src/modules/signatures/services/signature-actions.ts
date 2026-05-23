"use server";

import { revalidatePath } from "next/cache";

import {
  assertOrganizationAccess,
  loadServerOrganizationScope,
  ScopeGuardError,
} from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  buildSignatureTransitionLabel,
  mapStatusToAuditAction,
} from "@/modules/signatures/services/signature-action-helpers";
import {
  mapSignatureProfileRow,
  mapSignatureRequestRow,
} from "@/modules/signatures/services/signature-data";
import { canTransitionSignatureRequest } from "@/modules/signatures/services/signature-flow";
import { prepareWhatsappValidationMessage } from "@/modules/signatures/services/signature-flow";
import type {
  SignatureRequestStatus,
  SignatureWhatsappPayload,
} from "@/modules/signatures/types/signature";
import type { Tables } from "@/types/supabase";

const fallbackActorId = "user_adminbtp_system";
type SignatureRequestRow = Tables<"signature_requests">;
type SignatureProfileRow = Tables<"signature_profiles">;
type DocumentRow = Tables<"documents">;

export type SignatureMutationState = {
  status: "idle" | "success" | "error";
  mode: "demo" | "supabase";
  message: string;
};

export const initialSignatureMutationState: SignatureMutationState = {
  status: "idle",
  mode: "demo",
  message: "",
};

export async function createSignatureRequestAction(
  _previousState: SignatureMutationState,
  formData: FormData,
): Promise<SignatureMutationState> {
  const documentId = readRequiredField(formData, "documentId");
  const organizationId = readRequiredField(formData, "organizationId");
  const signatureProfileId = readRequiredField(formData, "signatureProfileId");
  const requestedBy = readOptionalField(formData, "requestedBy") ?? fallbackActorId;
  const validationNotes =
    readOptionalField(formData, "validationNotes") ?? "Demande creee depuis l'espace signatures.";

  if (!documentId || !organizationId || !signatureProfileId) {
    return {
      status: "error",
      mode: "demo",
      message: "Impossible de creer une demande sans document, organisation et profil de signature.",
    };
  }

  const supabase = await createClient();

  if (!supabase) {
    return {
      status: "success",
      mode: "demo",
      message: "Supabase indisponible. La demande de signature reste simulee en mode demonstration.",
    };
  }

  const organizationScope = await loadServerOrganizationScope(supabase);

  if (!organizationScope) {
    return {
      status: "error",
      mode: "supabase",
      message: "Le scope organisation de la session est introuvable. Reconnectez-vous avant de creer une demande de signature.",
    };
  }

  try {
    assertOrganizationAccess(organizationScope, organizationId);
  } catch (error) {
    if (error instanceof ScopeGuardError) {
      return {
        status: "error",
        mode: "supabase",
        message: error.message,
      };
    }

    throw error;
  }

  const { data: documentRow, error: documentError } = await supabase
    .from("documents")
    .select("id, organization_id")
    .eq("id", documentId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (documentError || !documentRow) {
    return {
      status: "error",
      mode: "supabase",
      message: "Le document cible est introuvable dans Supabase.",
    };
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("signature_profiles")
    .select("id, organization_id")
    .eq("id", signatureProfileId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (profileError || !profileRow) {
    return {
      status: "error",
      mode: "supabase",
      message: "Le profil de signature cible est introuvable dans Supabase.",
    };
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("signature_requests")
    .insert({
      document_id: documentId,
      organization_id: organizationId,
      requested_by: requestedBy,
      approver_id: null,
      signature_profile_id: signatureProfileId,
      status: "draft",
      validation_notes: validationNotes,
      whatsapp_payload: {},
    })
    .select("id")
    .limit(1);

  if (insertError || !insertedRows?.[0]) {
    return {
      status: "error",
      mode: "supabase",
      message: "La creation de la demande de signature a echoue dans Supabase.",
    };
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    entity_type: "signature_request",
    entity_id: insertedRows[0].id,
    action_type: "created",
    actor_user_id: requestedBy,
    details: {
      label: "Demande de signature creee depuis l'interface AdminBTP",
    },
  });

  if (auditError) {
    return {
      status: "error",
      mode: "supabase",
      message: "La demande a ete creee, mais l'ecriture du journal d'audit a echoue.",
    };
  }

  revalidatePath("/signatures");
  revalidatePath("/documents");

  return {
    status: "success",
    mode: "supabase",
    message: "Nouvelle demande de signature creee et journalisee dans Supabase.",
  };
}

export async function transitionSignatureRequestAction(
  _previousState: SignatureMutationState,
  formData: FormData,
): Promise<SignatureMutationState> {
  const requestId = readRequiredField(formData, "requestId");
  const organizationId = readRequiredField(formData, "organizationId");
  const currentStatus = readRequiredField(formData, "currentStatus") as SignatureRequestStatus | null;
  const nextStatus = readRequiredField(formData, "nextStatus") as SignatureRequestStatus | null;
  const actorUserId = readOptionalField(formData, "actorUserId") ?? fallbackActorId;

  if (!requestId || !organizationId || !currentStatus || !nextStatus) {
    return {
      status: "error",
      mode: "demo",
      message: "Impossible de traiter la transition sans identifiants complets.",
    };
  }

  if (!canTransitionSignatureRequest(currentStatus, nextStatus)) {
    return {
      status: "error",
      mode: "demo",
      message: `Transition interdite de ${currentStatus} vers ${nextStatus}.`,
    };
  }

  const supabase = await createClient();

  if (!supabase) {
    return {
      status: "success",
      mode: "demo",
      message: `Supabase indisponible. La transition vers ${nextStatus} reste simulee.`,
    };
  }

  const organizationScope = await loadServerOrganizationScope(supabase);

  if (!organizationScope) {
    return {
      status: "error",
      mode: "supabase",
      message: "Le scope organisation de la session est introuvable. Reconnectez-vous avant de mettre a jour la demande.",
    };
  }

  try {
    assertOrganizationAccess(organizationScope, organizationId);
  } catch (error) {
    if (error instanceof ScopeGuardError) {
      return {
        status: "error",
        mode: "supabase",
        message: error.message,
      };
    }

    throw error;
  }

  const requestContext = await resolveSignatureRequestContext(
    supabase,
    requestId,
    organizationId,
  );

  if (!requestContext.requestRow) {
    return {
      status: "error",
      mode: "supabase",
      message: "La demande de signature cible est introuvable dans Supabase.",
    };
  }

  const whatsappPayload =
    nextStatus === "pending_signature" ?
      buildSignatureWhatsappPayload(
        requestContext.requestRow,
        requestContext.profileRow,
        requestContext.documentRow,
      )
    : null;

  if (nextStatus === "pending_signature" && !whatsappPayload) {
    return {
      status: "error",
      mode: "supabase",
      message:
        "La preparation WhatsApp exige un document et un profil de signature complets dans Supabase.",
    };
  }

  const { error: updateError } = await supabase
    .from("signature_requests")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
      ...(whatsappPayload ? { whatsapp_payload: whatsappPayload } : {}),
    })
    .eq("id", requestId)
    .eq("organization_id", organizationId);

  if (updateError) {
    return {
      status: "error",
      mode: "supabase",
      message: "La mise a jour du statut de signature a echoue dans Supabase.",
    };
  }

  const auditActionType = mapStatusToAuditAction(nextStatus);
  const { error: auditError } = await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    entity_type: "signature_request",
    entity_id: requestId,
    action_type: auditActionType,
    actor_user_id: actorUserId,
    details: {
      label: buildSignatureTransitionLabel(nextStatus),
      ...(whatsappPayload ?
        {
          whatsapp_payload_ready: true,
          whatsapp_destination_status: whatsappPayload.destinationStatus,
          whatsapp_message: whatsappPayload.message,
        }
      : {}),
    },
  });

  if (auditError) {
    return {
      status: "error",
      mode: "supabase",
      message: "Le statut a ete mis a jour, mais le journal d'audit n'a pas pu etre complete.",
    };
  }

  revalidatePath("/signatures");
  revalidatePath("/documents");

  return {
    status: "success",
    mode: "supabase",
    message: `Demande de signature mise a jour vers ${nextStatus}.`,
  };
}

async function resolveSignatureRequestContext(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  requestId: string,
  organizationId: string,
): Promise<{
  requestRow: SignatureRequestRow | null;
  profileRow: SignatureProfileRow | null;
  documentRow: DocumentRow | null;
}> {
  const { data: requestRow, error: requestError } = await supabase
    .from("signature_requests")
    .select("*")
    .eq("id", requestId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (requestError || !requestRow) {
    return {
      requestRow: null,
      profileRow: null,
      documentRow: null,
    };
  }

  const [profileRow, documentRow] = await Promise.all([
    resolveSignatureProfileRow(supabase, requestRow.signature_profile_id, organizationId),
    resolveDocumentRow(supabase, requestRow.document_id, organizationId),
  ]);

  return {
    requestRow,
    profileRow,
    documentRow,
  };
}

async function resolveSignatureProfileRow(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  signatureProfileId: string | null,
  organizationId: string,
): Promise<SignatureProfileRow | null> {
  if (!signatureProfileId) {
    return null;
  }

  const { data, error } = await supabase
    .from("signature_profiles")
    .select("*")
    .eq("id", signatureProfileId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

async function resolveDocumentRow(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  documentId: string,
  organizationId: string,
): Promise<DocumentRow | null> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

function buildSignatureWhatsappPayload(
  requestRow: SignatureRequestRow,
  profileRow: SignatureProfileRow | null,
  documentRow: DocumentRow | null,
): SignatureWhatsappPayload | null {
  if (!profileRow || !documentRow) {
    return null;
  }

  const request = mapSignatureRequestRow(requestRow, documentRow);
  const profile = mapSignatureProfileRow(profileRow);

  return prepareWhatsappValidationMessage(request, {
    profile,
  });
}

function readRequiredField(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readOptionalField(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
