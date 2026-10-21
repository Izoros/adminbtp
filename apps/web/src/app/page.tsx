"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { HardHat, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const authSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "6 caractères minimum"),
});
type AuthForm = z.infer<typeof authSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthForm>({ resolver: zodResolver(authSchema) });

  async function onSubmit(values: AuthForm) {
    setServerError(null);
    setConfirmationSent(false);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword(values);
      if (error) {
        setServerError(
          error.message === "Invalid login credentials"
            ? "Email ou mot de passe incorrect."
            : error.message
        );
        return;
      }
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp(values);
    if (error) {
      setServerError(error.message);
      return;
    }
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setConfirmationSent(true);
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-night-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-chantier-orange">
            <HardHat className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-lg font-semibold">AdminBTP</h1>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-xl border border-white/10 bg-night-900 p-6 shadow-xl"
        >
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-white/80">
              Adresse email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="prenom.nom@societe.yt"
                className="border-white/10 bg-night-800 pl-9 text-white placeholder:text-white/40"
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-xs text-status-danger">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-white/80">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                placeholder="••••••••"
                className="border-white/10 bg-night-800 pl-9 text-white placeholder:text-white/40"
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-status-danger">{errors.password.message}</p>
            )}
          </div>

          {serverError && <p className="text-sm text-status-danger">{serverError}</p>}
          {confirmationSent && (
            <p className="text-sm text-status-success">
              Compte créé — vérifiez votre boîte mail pour confirmer votre adresse avant de vous
              connecter.
            </p>
          )}

          <Button type="submit" variant="accent" className="w-full" disabled={isSubmitting}>
            {mode === "signin" ? "Se connecter" : "Créer un compte"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setServerError(null);
              setConfirmationSent(false);
            }}
            className="w-full text-center text-xs text-white/50 hover:text-white/80"
          >
            {mode === "signin"
              ? "Pas encore de compte ? Créer un compte"
              : "Déjà un compte ? Se connecter"}
          </button>

          {mode === "signup" && (
            <p className="text-center text-xs text-white/40">
              Un nouveau compte démarre sans organisation ni droit d&apos;écriture — un
              administrateur AdminBTP doit vous rattacher à une société cliente.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
