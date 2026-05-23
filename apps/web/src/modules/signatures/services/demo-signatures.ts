import type {
  AuditLogEntry,
  SignatureProfile,
  SignatureRequest,
} from "@/modules/signatures/types/signature";

export const demoSignatureProfiles: SignatureProfile[] = [
  {
    id: "signature_profile_001",
    organizationId: "org_adminbtp_001",
    label: "Visa gestionnaire",
    signerName: "Gestionnaire AdminBTP",
    signerRole: "Responsable suivi administratif",
    signatureStyle: "typed",
    whatsappEnabled: true,
  },
];

export const demoSignatureRequests: SignatureRequest[] = [
  {
    id: "signature_request_001",
    documentId: "document_001",
    organizationId: "org_adminbtp_001",
    signatureProfileId: "signature_profile_001",
    requestedBy: "user_demo_adminbtp_001",
    approverId: "user_demo_adminbtp_001",
    status: "pending_internal_validation",
    validationNotes: "Verifier le point d'interface technique avant envoi au client.",
  },
];

export const demoAuditLogEntries: AuditLogEntry[] = [
  {
    id: "audit_001",
    organizationId: "org_adminbtp_001",
    entityType: "signature_request",
    entityId: "signature_request_001",
    actionType: "created",
    actorUserId: "user_demo_adminbtp_001",
    label: "Demande de validation creee",
  },
  {
    id: "audit_002",
    organizationId: "org_adminbtp_001",
    entityType: "signature_request",
    entityId: "signature_request_001",
    actionType: "submitted",
    actorUserId: "user_demo_adminbtp_001",
    label: "Demande transmise au circuit interne",
  },
];
