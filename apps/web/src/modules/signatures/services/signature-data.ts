import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type {
  AuditLogEntry,
  SignatureProfile,
  SignatureRequest,
  SignatureWhatsappPayload,
} from "@/modules/signatures/types/signature";
import type { Json, SupabaseDatabase, Tables } from "@/types/supabase";

type SignatureProfileRow = Tables<"signature_profiles">;
type SignatureRequestRow = Tables<"signature_requests">;
type AuditLogRow = Tables<"audit_logs">;
type DocumentRow = Tables<"documents">;

export type SignatureWorkflowData = {
  profile: SignatureProfile | null;
  request: SignatureRequest | null;
  auditEntries: AuditLogEntry[];
  source: "supabase";
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
    whatsappPayload: normalizeWhatsappPayload(row.whatsapp_payload, row, documentRow),
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
  const normalizedPayload = normalizeWhatsappPayload(payload);

  if (normalizedPayload?.message) {
    return normalizedPayload.message;
  }

  if (normalizedPayload?.body) {
    return normalizedPayload.body;
  }

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

export function normalizeWhatsappPayload(
  payload: Json,
  requestRow?: SignatureRequestRow,
  documentRow?: DocumentRow | null,
): SignatureWhatsappPayload | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const record = payload as Record<string, Json>;
  const channel = typeof record.channel === "string" ? record.channel.trim() : "";
  const destination = typeof record.destination === "string" ? record.destination.trim() : "";
  const message = typeof record.message === "string" ? record.message.trim() : "";
  const body = typeof record.body === "string" ? record.body.trim() : "";
  const preparedAt =
    typeof record.preparedAt === "string" && record.preparedAt.trim().length > 0 ?
      record.preparedAt.trim()
    : requestRow?.updated_at ?? null;

  if (channel !== "whatsapp" || !destination || !message || !body || !preparedAt) {
    return null;
  }

  const destinationStatus =
    record.destinationStatus === "disabled" ? "disabled" : "pending_configuration";
  const template =
    record.template === "signature_validation_v1" ?
      "signature_validation_v1"
    : "signature_validation_v1";

  return {
    channel: "whatsapp",
    destination,
    destinationStatus,
    template,
    requestId:
      typeof record.requestId === "string" && record.requestId.trim().length > 0 ?
        record.requestId.trim()
      : requestRow?.id ?? "",
    organizationId:
      typeof record.organizationId === "string" && record.organizationId.trim().length > 0 ?
        record.organizationId.trim()
      : requestRow?.organization_id ?? "",
    documentId:
      typeof record.documentId === "string" && record.documentId.trim().length > 0 ?
        record.documentId.trim()
      : requestRow?.document_id ?? "",
    documentTitle:
      typeof record.documentTitle === "string" && record.documentTitle.trim().length > 0 ?
        record.documentTitle.trim()
      : documentRow?.title?.trim() || undefined,
    documentStatus:
      typeof record.documentStatus === "string" && record.documentStatus.trim().length > 0 ?
        record.documentStatus.trim()
      : documentRow?.status ?? undefined,
    signatureProfileLabel:
      typeof record.signatureProfileLabel === "string" &&
      record.signatureProfileLabel.trim().length > 0 ?
        record.signatureProfileLabel.trim()
      : undefined,
    signerName:
      typeof record.signerName === "string" && record.signerName.trim().length > 0 ?
        record.signerName.trim()
      : undefined,
    signerRole:
      typeof record.signerRole === "string" && record.signerRole.trim().length > 0 ?
        record.signerRole.trim()
      : undefined,
    preparedAt,
    message,
    body,
  };
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
  if (!requestRow) {
    return null;
  }

  const mappedRequest = mapSignatureRequestRow(requestRow, documentRow);
  const whatsappSummary = extractWhatsappSummary(requestRow.whatsapp_payload);
  const sourceMessage = buildSignatureSourceMessage({
    profileAvailable: Boolean(profileRow),
    documentAvailable: Boolean(documentRow),
    auditFallbackReason: options?.auditFallbackReason,
    whatsappSummaryAvailable: Boolean(whatsappSummary),
  });

  return {
    profile: profileRow ? mapSignatureProfileRow(profileRow) : null,
    request: {
      ...mappedRequest,
      validationNotes:
        mappedRequest.validationNotes ??
        whatsappSummary ??
        "Aucune note de validation renseignee pour cette demande.",
    },
    auditEntries: auditRows.map(mapAuditLogRow),
    source: "supabase",
    sourceMessage,
  };
}

export function buildEmptySupabaseSignatureWorkflowData(
  reason: string,
): SignatureWorkflowData {
  return {
    profile: null,
    request: null,
    auditEntries: [],
    source: "supabase",
    sourceMessage: reason,
  };
}

export async function getSignatureWorkflowData(): Promise<SignatureWorkflowData> {
  const supabase = await createClient();

  if (!supabase) {
    return buildEmptySupabaseSignatureWorkflowData(
      "Configuration Supabase absente. Le module signatures ne peut pas charger de donnees.",
    );
  }

  try {
    const { data: requestRows, error: requestError } = await supabase
      .from("signature_requests")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (requestError) {
      return buildEmptySupabaseSignatureWorkflowData(
        "Supabase est accessible, mais la lecture des demandes de signature a echoue.",
      );
    }

    const requestRow = requestRows?.[0] ?? null;

    if (!requestRow) {
      return buildEmptySupabaseSignatureWorkflowData(
        "Supabase est accessible, mais aucune demande de signature n'est encore disponible.",
      );
    }

    const [profileRow, documentRow] = await Promise.all([
      resolveSignatureProfileRow(supabase, requestRow),
      resolveDocumentRow(supabase, requestRow.document_id),
    ]);

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
              "La demande de signature est chargee depuis Supabase, mais le journal d'audit est indisponible."
            : undefined,
        },
      ) ??
      buildEmptySupabaseSignatureWorkflowData(
        "Supabase est accessible, mais les donnees du workflow de signature sont incompletes.",
      )
    );
  } catch {
    return buildEmptySupabaseSignatureWorkflowData(
      "Supabase est accessible, mais le workflow de signature n'a pas pu etre reconstruit.",
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
  profileAvailable,
  documentAvailable,
  auditFallbackReason,
  whatsappSummaryAvailable,
}: {
  profileAvailable: boolean;
  documentAvailable: boolean;
  auditFallbackReason?: string;
  whatsappSummaryAvailable: boolean;
}): string {
  if (auditFallbackReason) {
    return auditFallbackReason;
  }

  if (!profileAvailable && documentAvailable) {
    return "Demande et document associe charges depuis Supabase, mais le profil de signature est introuvable.";
  }

  if (!profileAvailable) {
    return "Demande chargee depuis Supabase, mais le profil de signature est introuvable.";
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
