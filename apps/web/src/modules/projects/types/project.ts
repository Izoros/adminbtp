export type ProjectStatus =
  | "draft"
  | "active"
  | "on_hold"
  | "completed"
  | "cancelled";

export type ProjectRole =
  | "moa"
  | "moe"
  | "tce"
  | "bet"
  | "opc"
  | "amo"
  | "trade_contractor"
  | "subcontractor";

export type Project = {
  id: string;
  code: string;
  slug: string;
  name: string;
  description: string;
  status: ProjectStatus;
  ownerOrganizationId: string;
  startsOn: string;
  endsOn?: string;
};

export type ProjectOrganization = {
  projectId: string;
  organizationId: string;
  role: ProjectRole;
  isLead: boolean;
};

export type ProjectRoleView = {
  role: ProjectRole;
  title: string;
  summary: string;
  priorities: string[];
  indicators: string[];
};

export type ProjectFormFeedback = {
  tone: "success" | "error" | "info";
  message: string;
};
