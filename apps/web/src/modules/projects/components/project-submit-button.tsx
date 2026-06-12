"use client";

import { useFormStatus } from "react-dom";

type ProjectSubmitButtonProps = {
  disabled: boolean;
};

export function ProjectSubmitButton({ disabled }: ProjectSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
    >
      {pending ? "Creation en cours..." : "Creer le chantier"}
    </button>
  );
}
