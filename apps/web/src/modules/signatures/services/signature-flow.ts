import type {
  AuditActionType,
  AuditLogEntry,
  SignatureRequest,
  SignatureRequestStatus,
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

export function prepareWhatsappValidationMessage(request: SignatureRequest) {
  return {
    channel: "whatsapp",
    destination: "a-renseigner",
    body: `Validation requise pour la demande ${request.id}. Statut courant : ${request.status}.`,
  };
}
