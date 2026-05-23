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
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextValue = Array.isArray(resolvedSearchParams?.next)
    ? resolvedSearchParams?.next[0]
    : resolvedSearchParams?.next;
  const nextPath = sanitizeRedirectPath(nextValue);
  const user = await getAuthenticatedUser();

  if (user) {
    redirect(nextPath || getDefaultAuthRedirect());
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_38%,#f5f2ec_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/75 bg-[linear-gradient(140deg,#231f1d_0%,#181513_100%)] p-8 text-white shadow-[0_28px_90px_rgba(15,23,42,0.26)]">
          <p className="text-xs font-medium tracking-[0.24em] text-stone-400 uppercase">
            Phase 1
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">
            Authentification et multi-tenant.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-8 text-stone-300">
            Cette phase pose la connexion utilisateur, le rattachement a une ou
            plusieurs organisations et la base de securite RLS pour Supabase.
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
            Le flux de phase 1 utilise un lien de connexion par email, plus simple
            a securiser dans un socle SaaS multi-tenant.
          </p>

          <div className="mt-8">
            <LoginForm nextPath={nextPath} />
          </div>
        </section>
      </div>
    </main>
  );
}
