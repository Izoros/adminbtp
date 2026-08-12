"use client";

import { useActionState, type ReactNode } from "react";

import type { PhaseMutationState } from "@/modules/phases/services/phase-actions";

const initialState: PhaseMutationState = {
  status: "idle",
  mode: "supabase",
  message: "",
};

type PhaseActionFormProps = {
  action: (
    previousState: PhaseMutationState,
    formData: FormData,
  ) => Promise<PhaseMutationState>;
  children: ReactNode;
  submitLabel: string;
  pendingLabel: string;
  className?: string;
  buttonClassName: string;
};

export function PhaseActionForm({
  action,
  children,
  submitLabel,
  pendingLabel,
  className,
  buttonClassName,
}: PhaseActionFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className={className}>
      {children}
      <button type="submit" className={buttonClassName} disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </button>
      <p
        className={
          state.status === "error"
            ? "mt-2 text-xs font-medium text-destructive"
            : "mt-2 text-xs font-medium text-emerald-700"
        }
        aria-live="polite"
      >
        {state.message}
      </p>
    </form>
  );
}
