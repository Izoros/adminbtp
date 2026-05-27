export type MailboxMutationState = {
  status: "idle" | "success" | "error";
  mode: "supabase";
  message: string;
};

export const initialMailboxMutationState: MailboxMutationState = {
  status: "idle",
  mode: "supabase",
  message: "",
};
