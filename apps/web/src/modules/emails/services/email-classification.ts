import type { EmailClassification, EmailRecord } from "@/modules/emails/types/email";

export function reclassifyEmail(email: EmailRecord, classification: EmailClassification) {
  return {
    ...email,
    classification,
  };
}

export function isEmailLinkedToBusinessContext(email: EmailRecord) {
  return Boolean(email.organizationId && email.projectId && email.relatedTaskId);
}
