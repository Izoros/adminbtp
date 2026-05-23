export type AiMutationState = {
  status: "idle" | "success" | "error";
  mode: "demo" | "supabase";
  message: string;
};

export function buildInitialAiMutationState(): AiMutationState {
  return {
    status: "idle",
    mode: "demo",
    message: "",
  };
}
