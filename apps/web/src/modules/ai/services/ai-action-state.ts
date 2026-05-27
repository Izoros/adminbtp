export type AiMutationState = {
  status: "idle" | "success" | "error";
  mode: "supabase";
  message: string;
};

export function buildInitialAiMutationState(): AiMutationState {
  return {
    status: "idle",
    mode: "supabase",
    message: "",
  };
}
