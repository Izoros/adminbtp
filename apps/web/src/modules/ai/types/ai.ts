export type AiSuggestionKind =
  | "email_summary"
  | "document_classification"
  | "letter_draft"
  | "ppsps_assistance"
  | "dc4_assistance"
  | "smart_search";

export type AiSuggestionStatus =
  | "proposed"
  | "pending_human_validation"
  | "approved"
  | "rejected"
  | "applied";

export type AiSourceEntityType = "email" | "document" | "project" | "search";

export type AiOutputPayload = Record<
  string,
  string | string[] | number | boolean | null
>;

export type AiGovernanceSeverity = "info" | "warning" | "critical";

export type AiGovernanceIssue = {
  code: string;
  severity: AiGovernanceSeverity;
  message: string;
};

export type AiSuggestion = {
  id: string;
  organizationId: string;
  projectId?: string;
  sourceEntityType: AiSourceEntityType;
  sourceEntityId: string;
  kind: AiSuggestionKind;
  title: string;
  summary: string;
  promptSnapshot: string;
  outputPayload: AiOutputPayload;
  status: AiSuggestionStatus;
  proposedBy: "ai";
  validatedBy?: string;
  appliedBy?: string;
  governanceIssues?: AiGovernanceIssue[];
  governanceState?: "healthy" | "warning" | "blocked";
  auditTrailCount?: number;
};

export type AiSuggestionAuditLog = {
  id: string;
  aiSuggestionId: string;
  actorType: "ai" | "user" | "system";
  actorId?: string;
  action: string;
  details: string;
};
