import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import {
  demoAuditLogEntries,
  demoSignatureProfiles,
  demoSignatureRequests,
} from "@/modules/signatures/services/demo-signatures";
import type {
  AuditLogEntry,
  SignatureProfile,
  SignatureRequest,
} from "@/modules/signatures/types/signature";
import type { Json, SupabaseDatabase, Tables } from "@/types/supabase";

type SignatureProfileRow = Tables<"signature_profiles">;
type SignatureRequestRow = Tables<"signature_requests">;
type AuditLogRow = Tables<"audit_logs">;
type DocumentRow = Tables<"documents">;

export type SignatureWorkflowData = {
  profile: SignatureProfile;
  request: SignatureRequest;
  auditEntries: AuditLogEntry[];
  source: "supabase" | "demo";
  sourceMessage: string;
};

export function mapSignatureProfileRow(row: SignatureProfileRow): SignatureProfile {
  return {
    id: row.id,
    organizationId: row.organization_id,
    label: normalizeLabel(row.label, "Profil sans libelle"),
    signerName: normalizeLabel(row.signer_name, "Signataire non renseigne"),
    signerRole: normalizeLabel(row.signer_role, "Role non renseigne"),
    signatureStyle: normalizeLabel(row.signature_style, "typed"),
    whatsappEnabled: row.whatsapp_enabled,
  };
}

export function mapSignatureRequestRow(
  row: SignatureRequestRow,
  documentRow?: DocumentRow | null,
): SignatureRequest {
  return {
    id: row.id,
    documentId: row.document_id,
    documentTitle: documentRow?.title?.trim() || undefined,
    documentStatus: documentRow?.status,
    organizationId: row.organization_id,
    signatureProfileId: row.signature_profile_id ?? "",
    requestedBy: row.requested_by,
    approverId: row.approver_id ?? undefined,
    status: row.status,
    validationNotes: normalizeOptionalText(row.validation_notes),
  };
}

export function mapAuditLogRow(row: AuditLogRow): AuditLogEntry {
  const details = row.details;
  const detailLabel =
    details && typeof details === "object" && !Array.isArray(details) && "label" in details && typeof details.label === "string" ?
      details.label
    : undefined;

  return {
    id: row.id,
    organizationId: row.organization_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    actionType: row.action_type,
    actorUserId: row.actor_user_id,
    label: detailLabel ?? `Action ${row.action_type}`,
    createdAt: row.created_at,
  };
}

export function extractWhatsappSummary(payload: Json): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const record = payload as Record<string, Json>;
  const candidateKeys = ["message", "preview", "body"] as const;

  for (const key of candidateKeys) {
    const value = record[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

export function buildSignatureWorkflowDataFromRows(
  profileRow: SignatureProfileRow | null,
  requestRow: SignatureRequestRow | null,
  auditRows: AuditLogRow[],
  documentRow?: DocumentRow | null,
  options?: {
    auditFallbackReason?: string;
  },
): SignatureWorkflowData | null {
  if (!profileRow || !requestRow) {
    return null;
  }

  const mappedRequest = mapSignatureRequestRow(requestRow, documentRow);
  const whatsappSummary = extractWhatsappSummary(requestRow.whatsapp_payload);
  const sourceMessage = buildSignatureSourceMessage({
    documentAvailable: Boolean(documentRow),
    auditFallbackReason: options?.auditFallbackReason,
    whatsappSummaryAvailable: Boolean(whatsappSummary),
  });

  return {
    profile: mapSignatureProfileRow(profileRow),
    request: {
      ...mappedRequest,
      validationNotes:
        mappedRequest.validationNotes ??
        whatsappSummary ??
        "Aucune note de validation renseignee pour cette demande.",
    },
    auditEntries: auditRows.length > 0 ? auditRows.map(mapAuditLogRow) : demoAuditLogEntries,
    source: "supabase",
    sourceMessage,
  };
}

export function buildDemoSignatureWorkflowData(reason: string): SignatureWorkflowData {
  return {
    profile: demoSignatureProfiles[0]!,
    request: demoSignatureRequests[0]!,
    auditEntries: demoAuditLogEntries,
    source: "demo",
    sourceMessage: reason,
  };
}

export async function getSignatureWorkflowData(): Promise<SignatureWorkflowData> {
  const supabase = await createClient();

  if (!supabase) {
    return buildDemoSignatureWorkflowData(
      "Configuration Supabase absente. Affichage des donnees de demonstration.",
    );
  }

  try {
    const { data: requestRows, error: requestError } = await supabase
      .from("signature_requests")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (requestError) {
      return buildDemoSignatureWorkflowData(
        "Supabase a repondu avec une erreur sur les demandes de signature. Repli automatique sur les donnees de demonstration.",
      );
    }

    const requestRow = requestRows?.[0] ?? null;

    if (!requestRow) {
      return buildDemoSignatureWorkflowData(
        "Base disponible mais vide pour le module signatures. Repli sur les donnees de demonstration.",
      );
    }

    const [profileRow, documentRow] = await Promise.all([
      resolveSignatureProfileRow(supabase, requestRow),
      resolveDocumentRow(supabase, requestRow.document_id),
    ]);

    if (!profileRow) {
      return buildDemoSignatureWorkflowData(
        "Profil de signature introuvable dans Supabase. Repli sur les donnees de demonstration.",
      );
    }

    const { data: auditRows, error: auditError } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("entity_type", "signature_request")
      .eq("entity_id", requestRow.id)
      .order("created_at", { ascending: true });

    return (
      buildSignatureWorkflowDataFromRows(
        profileRow,
        requestRow,
        auditError ? [] : (auditRows ?? []),
        documentRow,
        {
          auditFallbackReason:
            auditError ?
              "Le journal d'audit Supabase est indisponible. Le fil d'audit de demonstration prend le relais."
            : undefined,
        },
      ) ??
      buildDemoSignatureWorkflowData(
        "Jeu de donnees incomplet dans Supabase. Repli sur les donnees de demonstration.",
      )
    );
  } catch {
    return buildDemoSignatureWorkflowData(
      "Base indisponible pour le module signatures. Repli sur les donnees de demonstration.",
    );
  }
}

async function resolveSignatureProfileRow(
  supabase: SupabaseClient<SupabaseDatabase>,
  requestRow: SignatureRequestRow,
): Promise<SignatureProfileRow | null> {
  if (requestRow.signature_profile_id) {
    const { data, error } = await supabase
      .from("signature_profiles")
      .select("*")
      .eq("id", requestRow.signature_profile_id)
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  }

  const { data, error } = await supabase
    .from("signature_profiles")
    .select("*")
    .eq("organization_id", requestRow.organization_id)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    return null;
  }

  return data?.[0] ?? null;
}

async function resolveDocumentRow(
  supabase: SupabaseClient<SupabaseDatabase>,
  documentId: string,
): Promise<DocumentRow | null> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

function buildSignatureSourceMessage({
  documentAvailable,
  auditFallbackReason,
  whatsappSummaryAvailable,
}: {
  documentAvailable: boolean;
  auditFallbackReason?: string;
  whatsappSummaryAvailable: boolean;
}): string {
  if (auditFallbackReason) {
    return auditFallbackReason;
  }

  if (documentAvailable && whatsappSummaryAvailable) {
    return "Demande, document associe et contexte WhatsApp charges depuis Supabase.";
  }

  if (documentAvailable) {
    return "Demande, profil et document associe charges depuis Supabase.";
  }

  return "Demande et profil de signature charges depuis Supabase.";
}

function normalizeLabel(value: string | null, fallback: string): string {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

function normalizeOptionalText(value: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
}
