import type { EmailClassification } from "@/modules/emails/types/email";

export type InboundEmailWebhookPayload = {
  organizationId: string;
  projectId?: string;
  title?: string;
  description?: string;
  sourceEmail: string;
  mailboxAddress?: string;
  senderEmail?: string;
  senderName?: string;
  subject?: string;
  bodyText?: string;
  receivedAt?: string;
  externalMessageId?: string;
  classification?: EmailClassification;
  relatedTaskId?: string;
  persistEmail?: boolean;
  autoCreateMailbox?: boolean;
  mailboxDisplayName?: string;
  mailboxProvider?: "internal" | "gmail" | "outlook";
};

export type ValidationRequestWebhookPayload = {
  signatureRequestId: string;
  channel?: "whatsapp";
  destination?: string;
  body?: string;
};

export type NormalizedInboundEmailWebhookPayload = {
  organizationId: string;
  projectId?: string;
  title: string;
  description: string;
  sourceEmail: string;
  mailboxAddress: string;
  senderEmail?: string;
  senderName?: string;
  subject?: string;
  bodyText?: string;
  receivedAt?: string;
  externalMessageId?: string;
  classification: EmailClassification;
  relatedTaskId?: string;
  persistEmail: boolean;
  autoCreateMailbox: boolean;
  mailboxDisplayName?: string;
  mailboxProvider?: "internal" | "gmail" | "outlook";
};

export type NormalizedValidationRequestWebhookPayload = {
  signatureRequestId: string;
  channel: "whatsapp";
  destination?: string;
  body?: string;
};

export type WebhookValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      errors: string[];
    };
