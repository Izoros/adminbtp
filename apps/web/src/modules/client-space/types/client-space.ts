export type ClientActionStatus = "pending" | "approved" | "rejected" | "commented";
export type ClientViewerMode = "internal" | "client" | "demo";

export type ClientWorkspaceItemType =
  | "document"
  | "validation"
  | "followup"
  | "ticket";

export type ClientWorkspaceItem = {
  id: string;
  organizationId: string;
  clientOrganizationId: string;
  projectId?: string;
  type: ClientWorkspaceItemType;
  accessScope?: string;
  title: string;
  summary: string;
  status: ClientActionStatus;
};

export type ClientComment = {
  id: string;
  workspaceItemId: string;
  clientOrganizationId: string;
  authorRole: "client" | "adminbtp";
  message: string;
  createdAt?: string;
};
