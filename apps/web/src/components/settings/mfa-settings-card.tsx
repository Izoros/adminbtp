"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Factor } from "@supabase/supabase-js";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Code à 6 chiffres"),
});
type CodeForm = z.infer<typeof codeSchema>;

interface PendingEnrollment {
  factorId: string;
  qrCodeSvg: string;
  secret: string;
}

/**
 * Carte "Sécurité du compte" — inscription/désinscription MFA (TOTP) via l'API native Supabase
 * Auth (`supabase.auth.mfa.*`). Aucun secret n'est stocké côté application : Supabase Auth gère
 * `auth.mfa_factors`/`auth.mfa_challenges` en interne. `public.users.mfa_enabled` (tenu à jour par
 * un trigger, voir database/migrations/0039_mfa_factor_sync.sql) sert uniquement de cache
 * d'affichage ailleurs dans l'UI (topbar) — cette carte, elle, interroge toujours `listFactors()`
 * directement pour rester garantie à jour.
 */
export function MfaSettingsCard() {
  const [loading, setLoading] = useState(true);
  const [factor, setFactor] = useState<Factor | null>(null);
  const [enrollment, setEnrollment] = useState<PendingEnrollment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CodeForm>({ resolver: zodResolver(codeSchema) });

  async function refreshFactor() {
    const supabase = createClient();
    const { data, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) {
      setError(listError.message);
      return;
    }
    setFactor(data?.totp[0] ?? null);
  }

  useEffect(() => {
    (async () => {
      await refreshFactor();
      setLoading(false);
    })();
  }, []);

  async function startEnrollment() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    const supabase = createClient();

    // Nettoie les tentatives d'inscription précédentes restées non vérifiées, pour éviter
    // d'accumuler des facteurs orphelins à chaque nouvel essai.
    const { data: existing } = await supabase.auth.mfa.listFactors();
    const stale =
      existing?.all.filter((f) => f.factor_type === "totp" && f.status === "unverified") ?? [];
    for (const factorToRemove of stale) {
      await supabase.auth.mfa.unenroll({ factorId: factorToRemove.id });
    }

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setBusy(false);
    if (enrollError || !data) {
      setError(enrollError?.message ?? "Impossible de démarrer l'inscription MFA.");
      return;
    }
    setEnrollment({
      factorId: data.id,
      qrCodeSvg: data.totp.qr_code,
      secret: data.totp.secret,
    });
  }

  async function cancelEnrollment() {
    if (!enrollment) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.mfa.unenroll({ factorId: enrollment.factorId });
    setBusy(false);
    setEnrollment(null);
    reset();
  }

  async function onConfirm(values: CodeForm) {
    if (!enrollment) return;
    setError(null);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrollment.factorId,
      code: values.code,
    });
    if (verifyError) {
      setError(
        verifyError.message === "Invalid TOTP code entered"
          ? "Code incorrect — réessayez."
          : verifyError.message
      );
      reset();
      return;
    }
    setEnrollment(null);
    reset();
    setSuccess("Double authentification activée.");
    await refreshFactor();
  }

  async function disableMfa() {
    if (!factor) return;
    if (!window.confirm("Désactiver la double authentification sur ce compte ?")) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    const supabase = createClient();
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    setBusy(false);
    if (unenrollError) {
      setError(unenrollError.message);
      return;
    }
    setFactor(null);
    setSuccess("Double authentification désactivée.");
  }

  if (loading) {
    return <p className="text-sm text-graphite-500">Chargement…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-graphite-900">
            Authentification à deux facteurs (TOTP)
          </p>
          <p className="text-xs text-graphite-500">
            Demande un code à 6 chiffres généré par une application d&apos;authentification
            (Google Authenticator, 1Password…) en plus du mot de passe, à chaque connexion.
          </p>
        </div>
        {factor ? (
          <Badge tone="success">
            <ShieldCheck className="h-3.5 w-3.5" /> Activée
          </Badge>
        ) : (
          <Badge tone="neutral">
            <ShieldOff className="h-3.5 w-3.5" /> Désactivée
          </Badge>
        )}
      </div>

      {error && <p className="text-sm text-status-danger">{error}</p>}
      {success && <p className="text-sm text-status-success">{success}</p>}

      {enrollment ? (
        <form onSubmit={handleSubmit(onConfirm)} className="space-y-3 rounded-md border border-surface-border p-4">
          <p className="text-xs text-graphite-500">
            Scannez ce QR code avec votre application d&apos;authentification, ou saisissez la clé
            manuellement, puis confirmez avec le code généré.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG en data: URI généré
              côté client, non éligible à l'optimisation next/image */}
          <img
            src={`data:image/svg+xml;utf-8,${encodeURIComponent(enrollment.qrCodeSvg)}`}
            alt="QR code d'inscription à la double authentification"
            width={176}
            height={176}
            className="rounded-md border border-surface-border bg-white p-2"
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite-500">
              Clé manuelle (si le QR code n&apos;est pas scannable)
            </label>
            <code className="block break-all rounded-md bg-surface-muted px-2 py-1 text-xs text-graphite-900">
              {enrollment.secret}
            </code>
          </div>
          <div>
            <label htmlFor="mfa-confirm-code" className="mb-1 block text-xs font-medium text-graphite-500">
              Code de confirmation
            </label>
            <Input
              id="mfa-confirm-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              className="w-40 text-center tracking-widest"
              {...register("code")}
            />
            {errors.code && <p className="mt-1 text-xs text-status-danger">{errors.code.message}</p>}
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="secondary" size="sm" disabled={isSubmitting}>
              Confirmer
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={cancelEnrollment} disabled={busy}>
              Annuler
            </Button>
          </div>
        </form>
      ) : factor ? (
        <Button type="button" variant="secondary" size="sm" onClick={disableMfa} disabled={busy}>
          Désactiver la double authentification
        </Button>
      ) : (
        <Button type="button" variant="secondary" size="sm" onClick={startEnrollment} disabled={busy}>
          Configurer la double authentification
        </Button>
      )}
    </div>
  );
}
