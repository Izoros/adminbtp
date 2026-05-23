import type {
  AuditActionType,
  AuditLogEntry,
  SignatureProfile,
  SignatureRequest,
  SignatureRequestStatus,
  SignatureWhatsappPayload,
} from "@/modules/signatures/types/signature";

const allowedTransitions: Record<SignatureRequestStatus, SignatureRequestStatus[]> = {
  draft: ["pending_internal_validation", "cancelled"],
  pending_internal_validation: ["pending_signature", "rejected"],
  pending_signature: ["approved", "rejected"],
  approved: [],
  rejected: [],
  cancelled: [],
};

export function canTransitionSignatureRequest(
  currentStatus: SignatureRequestStatus,
  nextStatus: SignatureRequestStatus,
) {
  return allowedTransitions[currentStatus].includes(nextStatus);
}

export function buildAuditLogEntry(
  request: SignatureRequest,
  actionType: AuditActionType,
  label: string,
): AuditLogEntry {
  return {
    id: `audit_${request.id}_${actionType}`,
    organizationId: request.organizationId,
    entityType: "signature_request",
    entityId: request.id,
    actionType,
    actorUserId: request.requestedBy,
    label,
  };
}

type PrepareWhatsappValidationMessageOptions = {
  profile?: Pick<
    SignatureProfile,
    "label" | "signerName" | "signerRole" | "whatsappEnabled"
  > | null;
  preparedAt?: string;
};

export function prepareWhatsappValidationMessage(
  request: SignatureRequest,
  options?: PrepareWhatsappValidationMessageOptions,
): SignatureWhatsappPayload {
  const preparedAt = options?.preparedAt ?? new Date().toISOString();
  const profile = options?.profile;
  const documentLabel = request.documentTitle ?? request.documentId;
  const message = `Validation requise pour ${documentLabel}. Statut courant : ${request.status}.`;
  const signatureContext =
    profile ?
      ` Signature cible : ${profile.signerName} (${profile.signerRole}).`
    : "";

  return {
    channel: "whatsapp",
    destination: "a-renseigner",
    destinationStatus: profile?.whatsappEnabled === false ? "disabled" : "pending_configuration",
    template: "signature_validation_v1",
    requestId: request.id,
    organizationId: request.organizationId,
    documentId: request.documentId,
    documentTitle: request.documentTitle,
    documentStatus: request.documentStatus,
    signatureProfileLabel: profile?.label,
    signerName: profile?.signerName,
    signerRole: profile?.signerRole,
    preparedAt,
    message,
    body: `${message}${signatureContext} Merci de confirmer la validation.`,
  };
}
