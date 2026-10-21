"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { HardHat, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "6 caractères minimum"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  function onSubmit() {
    // Mode démonstration : aucune authentification réelle (Supabase Auth non branché en Phase 1).
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-night-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-chantier-orange">
            <HardHat className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-lg font-semibold">AdminBTP</h1>
          <Badge tone="warning">Mode démonstration</Badge>
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
                autoComplete="current-password"
                placeholder="••••••••"
                className="border-white/10 bg-night-800 pl-9 text-white placeholder:text-white/40"
                {...register("password")}
              />
            </div>
            {errors.password && <p className="text-xs text-status-danger">{errors.password.message}</p>}
          </div>

          <Button type="submit" variant="accent" className="w-full" disabled={isSubmitting}>
            Se connecter
          </Button>

          <p className="text-center text-xs text-white/40">
            Authentification réelle (Supabase Auth, MFA) à activer en Phase 2.
          </p>
        </form>
      </div>
    </div>
  );
}
