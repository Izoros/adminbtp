import type { EmailClassification } from "@/modules/emails/types/email";

export const emailClassifications: EmailClassification[] = [
  "unclassified",
  "document",
  "payment_followup",
  "task",
  "client_message",
  "validation",
];

export type EmailMutationState = {
  status: "idle" | "success" | "error";
  mode: "supabase";
  message: string;
  emailId?: string;
};

export const initialEmailMutationState: EmailMutationState = {
  status: "idle",
  mode: "supabase",
  message: "",
};
