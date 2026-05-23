import type { SignatureRequestStatus } from "@/modules/signatures/types/signature";

export function buildSignatureTransitionLabel(nextStatus: SignatureRequestStatus): string {
  switch (nextStatus) {
    case "pending_internal_validation":
      return "Demande envoyee en validation interne";
    case "pending_signature":
      return "Signature externe preparee";
    case "approved":
      return "Demande approuvee";
    case "rejected":
      return "Demande rejetee";
    case "cancelled":
      return "Demande annulee";
    case "draft":
    default:
      return "Demande conservee au brouillon";
  }
}

export function mapStatusToAuditAction(nextStatus: SignatureRequestStatus) {
  switch (nextStatus) {
    case "pending_signature":
      return "signature_requested" as const;
    case "approved":
      return "approved" as const;
    case "rejected":
      return "rejected" as const;
    default:
      return "submitted" as const;
  }
}
