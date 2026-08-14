"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseProjectRef, hasSupabaseConfig } from "@/lib/env";
import { getDefaultAuthRedirect } from "@/modules/auth/services/session-navigation";

type LoginFormProps = {
  nextPath?: string;
  initialMessage?: string | null;
  loginPath?: "/" | "/login";
};

export function LoginForm({
  nextPath,
  initialMessage = null,
  loginPath = "/login",
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(initialMessage);
  const [activeAction, setActiveAction] = useState<"password" | "magic-link" | null>(null);
  const supabaseProjectRef = getSupabaseProjectRef();

  async function sendMagicLink() {
    setActiveAction("magic-link");
    setMessage(null);

    const supabase = createClient();

    if (!supabase) {
      setMessage("Configuration Supabase indisponible pour cette instance.");
      setActiveAction(null);
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
      setMessage("Le lien de connexion n'a pas pu etre envoye. Reessayez plus tard.");
      setActiveAction(null);
      return;
    }

    setMessage("Lien de connexion envoye. Ouvrez votre email pour continuer.");
    setActiveAction(null);
  }

  return (
    <form
      action="/auth/password-login"
      method="post"
      className="space-y-4"
      onSubmit={() => {
        setActiveAction("password");
        setMessage(null);
      }}
    >
      <input type="hidden" name="next" value={nextPath ?? getDefaultAuthRedirect()} />
      <input type="hidden" name="login_path" value={loginPath} />

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-stone-800">
          Email professionnel
        </label>
        <Input
          id="email"
          name="email"
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
          name="password"
          type="password"
          placeholder="Votre mot de passe"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Button
          type="submit"
          variant="outline"
          className="h-11 rounded-full"
          disabled={activeAction !== null}
        >
          {activeAction === "password" ? "Connexion..." : "Se connecter"}
        </Button>

        <Button
          type="button"
          className="h-11 rounded-full"
          disabled={activeAction !== null}
          onClick={sendMagicLink}
        >
          {activeAction === "magic-link" ? "Envoi en cours..." : "Recevoir un lien de connexion"}
        </Button>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
        {hasSupabaseConfig()
          ? `Connexion reelle activee via Supabase.${supabaseProjectRef ? ` Projet actif: ${supabaseProjectRef}.` : ""}`
          : "Configuration Supabase indisponible pour cette instance."}
      </div>

      <p className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
        Le mot de passe ouvre directement la session. Le lien email reste disponible en secours.
      </p>

      {message ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {message}
        </p>
      ) : null}
    </form>
  );
}
