export type OrganizationRole =
  | "org_owner"
  | "org_admin"
  | "org_member"
  | "org_viewer";

export type Organization = {
  id: string;
  slug: string;
  name: string;
  legalName?: string;
  isActive: boolean;
};

export type OrganizationMembership = {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
};

export type OrganizationFormFeedback = {
  tone: "success" | "error" | "info";
  message: string;
};
