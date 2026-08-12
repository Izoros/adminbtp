export type WhatsAppCommandKind =
  | "help"
  | "status_check"
  | "archive_status"
  | "development_request";

export type WhatsAppCommandStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "processing"
  | "completed"
  | "failed";

export type WhatsAppCommandCandidate = {
  providerMessageId: string;
  businessPhoneNumberId: string;
  senderPhone: string;
  commandText: string;
  commandKind: WhatsAppCommandKind;
  providerSentAt: string | null;
};

export type WhatsAppCommandQueueItem = {
  id: string;
  providerMessageId: string;
  senderFingerprint: string;
  commandText: string;
  commandKind: WhatsAppCommandKind;
  status: WhatsAppCommandStatus;
  providerSentAt: string | null;
  receivedAt: string;
  reviewedAt: string | null;
  completedAt: string | null;
  responseSummary: string | null;
  retentionUntil: string;
};

export type WhatsAppCommandQueueData = {
  updatedAt: string;
  sourceMessage: string;
  totalCommands: number;
  pendingCommands: number;
  completedCommands: number;
  failedCommands: number;
  commands: WhatsAppCommandQueueItem[];
};

export type WhatsAppCommandQueueAccessResult =
  | { access: "ready"; data: WhatsAppCommandQueueData }
  | {
      access: "unauthenticated" | "forbidden" | "unavailable";
      message: string;
    };
