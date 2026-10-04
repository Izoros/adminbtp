"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type AuthFormState,
  sendMagicLink,
  signInWithPassword,
} from "@/modules/auth/services/auth-actions";
import { FormMessage } from "@/modules/auth/components/form-message";

type LoginFormProps = {
  nextPath: string;
  initialError?: string | null;
  initialStatus?: string | null;
};

const initialState: AuthFormState = { status: "idle" };

// Un seul formulaire, deux intentions : mot de passe (par defaut) ou lien par email.
async function loginAction(previousState: AuthFormState, formData: FormData) {
  return formData.get("intent") === "magic-link"
    ? sendMagicLink(previousState, formData)
    : signInWithPassword(previousState, formData);
}

export function LoginForm({ nextPath, initialError, initialStatus }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  const message =
    state.status !== "idle"
      ? { tone: state.status, text: state.message }
      : initialError
        ? { tone: "error" as const, text: initialError }
        : initialStatus
          ? { tone: "success" as const, text: initialStatus }
          : null;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={nextPath} />

      {message?.text ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}

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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-stone-800">
            Mot de passe
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Mot de passe oublie ?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
        />
      </div>

      <Button
        type="submit"
        name="intent"
        value="password"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? "Connexion..." : "Se connecter"}
      </Button>

      <div className="flex items-center gap-3 text-xs text-stone-500" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        ou
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="submit"
        name="intent"
        value="magic-link"
        variant="outline"
        className="w-full"
        disabled={isPending}
      >
        Recevoir un lien de connexion par email
      </Button>
    </form>
  );
}
