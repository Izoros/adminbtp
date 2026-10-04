"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type AuthFormState, updatePassword } from "@/modules/auth/services/auth-actions";
import { FormMessage } from "@/modules/auth/components/form-message";

const initialState: AuthFormState = { status: "idle" };

export function PasswordForm({ initialStatus }: { initialStatus?: string | null }) {
  const [state, formAction, isPending] = useActionState(updatePassword, initialState);

  const message =
    state.status !== "idle"
      ? { tone: state.status, text: state.message }
      : initialStatus
        ? { tone: "success" as const, text: initialStatus }
        : null;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {message?.text ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-stone-800">
          Nouveau mot de passe
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
        />
        <p className="text-xs text-stone-500">10 caracteres minimum.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmation" className="text-sm font-medium text-stone-800">
          Confirmer le mot de passe
        </label>
        <Input
          id="confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Enregistrement..." : "Enregistrer le mot de passe"}
      </Button>
    </form>
  );
}
