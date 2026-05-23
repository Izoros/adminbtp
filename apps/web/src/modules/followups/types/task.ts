export type WorkflowTask = {
  id: string;
  organizationId: string;
  projectId?: string;
  title: string;
  description: string;
  source: "n8n" | "manual";
  status: "open" | "done";
};
