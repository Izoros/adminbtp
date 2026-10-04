"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type AuthFormState,
  requestPasswordReset,
} from "@/modules/auth/services/auth-actions";
import { FormMessage } from "@/modules/auth/components/form-message";

const initialState: AuthFormState = { status: "idle" };

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.status !== "idle" && state.message ? (
        <FormMessage tone={state.status}>{state.message}</FormMessage>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-stone-800">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="vous@entreprise.fr"
          defaultValue={state.email}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Envoi..." : "Envoyer le lien de reinitialisation"}
      </Button>
    </form>
  );
}
