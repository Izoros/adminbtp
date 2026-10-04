import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/supabase/server";
import { AuthShell } from "@/modules/auth/components/auth-shell";
import { LoginForm } from "@/modules/auth/components/login-form";
import {
  getAuthErrorMessage,
  getAuthStatusMessage,
  sanitizeRedirectPath,
} from "@/modules/auth/services/session-navigation";

export const metadata: Metadata = { title: "Connexion" };

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const nextPath = sanitizeRedirectPath(firstValue(params.next));

  if (await getAuthenticatedUser()) {
    redirect(nextPath);
  }

  return (
    <AuthShell
      title="Connexion"
      description="Accedez a votre espace AdminBTP."
      footer="Pas encore de compte ? Demandez une invitation a votre administrateur."
    >
      <LoginForm
        nextPath={nextPath}
        initialError={getAuthErrorMessage(firstValue(params.error))}
        initialStatus={getAuthStatusMessage(firstValue(params.status))}
      />
    </AuthShell>
  );
}
