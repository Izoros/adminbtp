import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/supabase/server";
import { AuthShell } from "@/modules/auth/components/auth-shell";
import { PasswordForm } from "@/modules/auth/components/password-form";
import {
  buildLoginRedirectPath,
  getAuthStatusMessage,
} from "@/modules/auth/services/session-navigation";

export const metadata: Metadata = { title: "Mot de passe" };

export default async function AccountPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string | string[] }>;
}) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect(buildLoginRedirectPath("/account/password", "session_required"));
  }

  const status = (await searchParams)?.status;

  return (
    <AuthShell
      title="Definir mon mot de passe"
      description={`Compte : ${user.email ?? "inconnu"}`}
      footer={
        <Link href="/admin" className="font-medium text-primary underline-offset-4 hover:underline">
          Aller au cockpit
        </Link>
      }
    >
      <PasswordForm
        initialStatus={getAuthStatusMessage(Array.isArray(status) ? status[0] : status)}
      />
    </AuthShell>
  );
}
