export type OperationsAlertKind =
  | "archive_failed"
  | "archive_stalled"
  | "archive_overdue";

export type OperationsAlertSeverity = "medium" | "high";

export type OperationsAlertCandidate = {
  fingerprint: string;
  kind: OperationsAlertKind;
  severity: OperationsAlertSeverity;
  title: string;
  sourceEntityId: string | null;
  occurredAt: string;
};

export type OperationsAlertScanResult = {
  ok: boolean;
  mode: "disabled" | "active";
  evaluated: number;
  delivered: number;
  deduplicated: number;
  failed: number;
  skippedReason?: string;
};

export type OperationsAlertStatus =
  | "pending"
  | "dispatching"
  | "delivered"
  | "failed";

export type OperationsAlertView = {
  id: string;
  kind: OperationsAlertKind;
  severity: OperationsAlertSeverity;
  title: string;
  sourceEntityId: string | null;
  occurredAt: string;
  status: OperationsAlertStatus;
  attempts: number;
  lastAttemptAt: string | null;
  deliveredAt: string | null;
  lastError: string | null;
};

export type OperationsAlertsData = {
  updatedAt: string;
  sourceMessage: string;
  totalAlerts: number;
  deliveredAlerts: number;
  failedAlerts: number;
  activeAlerts: number;
  alerts: OperationsAlertView[];
};

export type OperationsAlertsAccessResult =
  | { access: "ready"; data: OperationsAlertsData }
  | {
      access: "unauthenticated" | "forbidden" | "unavailable";
      message: string;
    };
