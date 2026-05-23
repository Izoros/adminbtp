export type InternalRole =
  | "platform_admin"
  | "operations_manager"
  | "support_agent"
  | "expert_consultant"
  | "member";

export type AppUserProfile = {
  id: string;
  email: string;
  fullName: string;
  internalRole: InternalRole;
  defaultOrganizationId?: string;
};
