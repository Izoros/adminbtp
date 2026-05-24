export type MailboxProvider = "internal" | "gmail" | "outlook";

export type EmailClassification =
  | "unclassified"
  | "document"
  | "payment_followup"
  | "task"
  | "client_message"
  | "validation";

export type Mailbox = {
  id: string;
  organizationId: string;
  address: string;
  displayName: string;
  provider: MailboxProvider;
  isActive: boolean;
};

export type EmailRecord = {
  id: string;
  mailboxId: string;
  organizationId: string;
  projectId?: string;
  receivedAt?: string;
  relatedTaskId?: string;
  senderEmail: string;
  senderName?: string;
  subject: string;
  bodyText: string;
  classification: EmailClassification;
};

export type DataOrigin = "demo" | "supabase";

export type MailboxBoardData = {
  organizationId: string;
  mailbox?: Mailbox;
  emails: EmailRecord[];
  dataOrigin: DataOrigin;
  fallbackReason?: string;
};

export type MailboxResolution = {
  mailboxId: string | null;
  dataOrigin: DataOrigin;
  mailboxCreated?: boolean;
};

export type MailboxBoardQuery = {
  organizationId?: string;
  mailboxAddress?: string;
  mailboxId?: string;
};
