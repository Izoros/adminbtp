export type SituationStatus =
  | "draft"
  | "sent"
  | "partially_paid"
  | "paid"
  | "disputed";

export type FollowupStatus = "scheduled" | "sent" | "done" | "cancelled";

export type Situation = {
  id: string;
  organizationId: string;
  projectId?: string;
  reference: string;
  customerName: string;
  amountCents: number;
  currencyCode: string;
  issuedOn: string;
  dueOn: string;
  status: SituationStatus;
};

export type PaymentFollowup = {
  id: string;
  situationId: string;
  organizationId: string;
  stepLabel: string;
  daysAfterDue: number;
  scheduledFor: string;
  status: FollowupStatus;
};

export type FollowupDataOrigin = "demo" | "supabase";

export type FollowupDashboardData = {
  situation: Situation;
  followups: PaymentFollowup[];
  dataOrigin: FollowupDataOrigin;
  fallbackReason?: string;
};

export type FollowupDashboardQuery = {
  organizationId?: string;
  projectId?: string;
  situationId?: string;
};
