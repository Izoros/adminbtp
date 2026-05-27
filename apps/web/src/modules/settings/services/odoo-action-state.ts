export type OdooMutationState = {
  status: "idle" | "success" | "error";
  mode: "supabase";
  message: string;
};

export function buildInitialOdooMutationState(): OdooMutationState {
  return {
    status: "idle",
    mode: "supabase",
    message: "",
  };
}
