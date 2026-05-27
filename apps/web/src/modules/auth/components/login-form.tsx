"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseProjectRef, hasSupabaseConfig } from "@/lib/env";
import { getDefaultAuthRedirect } from "@/modules/auth/services/session-navigation";

type LoginFormProps = {
  nextPath?: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabaseProjectRef = getSupabaseProjectRef();

  async function handleMagicLinkSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const supabase = createClient();

    if (!supabase) {
      setMessage(
        "Variables Supabase absentes: branchez le projet pour activer la connexion reelle.",
      );
      setIsSubmitting(false);
      return;
    }

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", nextPath ?? getDefaultAuthRedirect());

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    setMessage("Lien de connexion envoye. Ouvrez votre email pour continuer.");
    setIsSubmitting(false);
  }

  async function handlePasswordSubmit() {
    setIsSubmitting(true);
    setMessage(null);

    const supabase = createClient();

    if (!supabase) {
      setMessage(
        "Variables Supabase absentes: branchez le projet pour activer la connexion reelle.",
      );
      setIsSubmitting(false);
      return;
    }

    if (!password.trim()) {
      setMessage("Le mot de passe est obligatoire pour cette methode.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    window.location.href = nextPath ?? getDefaultAuthRedirect();
  }

  return (
    <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-stone-800">
          Email professionnel
        </label>
        <Input
          id="email"
          type="email"
          placeholder="vous@entreprise.fr"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-stone-800">
          Mot de passe
        </label>
        <Input
          id="password"
          type="password"
          placeholder="Votre mot de passe"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-full"
          disabled={isSubmitting}
          onClick={handlePasswordSubmit}
        >
          {isSubmitting ? "Connexion..." : "Se connecter"}
        </Button>

        <Button
          type="submit"
          className="h-11 rounded-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Envoi en cours..." : "Recevoir un lien de connexion"}
        </Button>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
        {hasSupabaseConfig()
          ? `Connexion reelle activee via Supabase.${supabaseProjectRef ? ` Projet actif: ${supabaseProjectRef}.` : ""}`
          : "Mode local: la vue reste testable sans projet Supabase branche."}
      </div>

      <p className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
        Tu peux utiliser soit un mot de passe, soit le lien magique par email.
      </p>

      {message ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {message}
        </p>
      ) : null}
    </form>
  );
}
