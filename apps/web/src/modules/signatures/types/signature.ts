export type SignatureRequestStatus =
  | "draft"
  | "pending_internal_validation"
  | "pending_signature"
  | "approved"
  | "rejected"
  | "cancelled";

export type AuditActionType =
  | "created"
  | "submitted"
  | "approved"
  | "rejected"
  | "signature_requested"
  | "whatsapp_prepared";

export type SignatureWhatsappPayload = {
  channel: "whatsapp";
  destination: string;
  destinationStatus: "pending_configuration" | "disabled";
  template: "signature_validation_v1";
  requestId: string;
  organizationId: string;
  documentId: string;
  documentTitle?: string;
  documentStatus?: string;
  signatureProfileLabel?: string;
  signerName?: string;
  signerRole?: string;
  preparedAt: string;
  message: string;
  body: string;
};

export type SignatureProfile = {
  id: string;
  organizationId: string;
  label: string;
  signerName: string;
  signerRole: string;
  signatureStyle: string;
  whatsappEnabled: boolean;
};

export type SignatureRequest = {
  id: string;
  documentId: string;
  documentTitle?: string;
  documentStatus?: string;
  organizationId: string;
  signatureProfileId: string;
  requestedBy: string;
  approverId?: string;
  status: SignatureRequestStatus;
  validationNotes?: string;
  whatsappPayload?: SignatureWhatsappPayload | null;
};

export type AuditLogEntry = {
  id: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  actionType: AuditActionType;
  actorUserId: string;
  label: string;
  createdAt?: string;
};
