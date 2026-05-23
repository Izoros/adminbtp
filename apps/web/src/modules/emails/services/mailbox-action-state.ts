export type MailboxMutationState = {
  status: "idle" | "success" | "error";
  mode: "demo" | "supabase";
  message: string;
};

export const initialMailboxMutationState: MailboxMutationState = {
  status: "idle",
  mode: "demo",
  message: "",
};
