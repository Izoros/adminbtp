import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  getDefaultAuthRedirect,
  sanitizeRedirectPath,
} from "@/modules/auth/services/session-navigation";
import { LoginForm } from "@/modules/auth/components/login-form";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
    error?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextValue = Array.isArray(resolvedSearchParams?.next)
    ? resolvedSearchParams?.next[0]
    : resolvedSearchParams?.next;
  const errorMessage = Array.isArray(resolvedSearchParams?.error)
    ? resolvedSearchParams?.error[0]
    : resolvedSearchParams?.error;
  const nextPath = sanitizeRedirectPath(nextValue);
  const user = await getAuthenticatedUser();

  if (user) {
    redirect(nextPath || getDefaultAuthRedirect());
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_38%,#f5f2ec_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/75 bg-[linear-gradient(140deg,#231f1d_0%,#181513_100%)] p-8 text-white shadow-[0_28px_90px_rgba(15,23,42,0.26)]">
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">
            Connexion securisee AdminBTP.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-8 text-stone-300">
            Connecte-toi avec ton compte plateforme pour acceder aux espaces
            multi-organisations, au pilotage chantier et aux modules d&apos;expertise.
          </p>
        </section>

        <section className="rounded-[2rem] border border-stone-200/80 bg-white p-8 shadow-[0_18px_54px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-medium tracking-[0.22em] text-stone-500 uppercase">
            Connexion
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
            Acces AdminBTP
          </h2>
          <p className="mt-3 text-sm leading-7 text-stone-600">
            Utilise ton mot de passe ou demande un lien de connexion email.
          </p>

          <div className="mt-8">
            <LoginForm nextPath={nextPath} initialMessage={errorMessage} />
          </div>
        </section>
      </div>
    </main>
  );
}
