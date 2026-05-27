export type DocumentStatus = "draft" | "generated" | "validated" | "archived";

export type DocumentTemplate = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  subject: string;
  bodyTemplate: string;
  letterheadName: string;
  logoLabel: string;
  stampLabel: string;
  signatureLabel: string;
};

export type GeneratedDocument = {
  id: string;
  templateId: string;
  organizationId?: string;
  projectId?: string;
  title: string;
  subject: string;
  bodyRendered: string;
  status: DocumentStatus;
};

export type DocumentVariableMap = Record<string, string>;

export type DocumentVariableSource =
  | "supabase_metadata"
  | "supabase_placeholder";
