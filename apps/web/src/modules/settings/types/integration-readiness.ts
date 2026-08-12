export type IntegrationReadinessStatus = "ready" | "attention" | "inactive";

export type IntegrationReadinessCheck = {
  label: string;
  ready: boolean;
  detail: string;
};

export type IntegrationReadinessGroup = {
  id: "supabase" | "whatsapp" | "archive" | "alerts";
  title: string;
  description: string;
  status: IntegrationReadinessStatus;
  statusLabel: string;
  checks: IntegrationReadinessCheck[];
};

export type IntegrationReadinessData = {
  updatedAt: string;
  readyGroups: number;
  totalGroups: number;
  groups: IntegrationReadinessGroup[];
};

export type IntegrationReadinessAccessResult =
  | { access: "ready"; data: IntegrationReadinessData }
  | {
      access: "unauthenticated" | "forbidden" | "unavailable";
      message: string;
    };
