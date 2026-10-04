import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/modules/auth/components/auth-shell";
import { ForgotPasswordForm } from "@/modules/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Mot de passe oublie" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Mot de passe oublie"
      description="Recevez un lien par email pour choisir un nouveau mot de passe."
      footer={
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Retour a la connexion
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
