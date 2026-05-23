export type OdooMutationState = {
  status: "idle" | "success" | "error";
  mode: "demo" | "supabase";
  message: string;
};

export function buildInitialOdooMutationState(): OdooMutationState {
  return {
    status: "idle",
    mode: "demo",
    message: "",
  };
}
