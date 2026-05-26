import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";

import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  getDefaultAuthRedirect,
  sanitizeRedirectPath,
} from "@/modules/auth/services/session-navigation";
import { LoginForm } from "@/modules/auth/components/login-form";
import {
  getTestAccessCookieName,
  hasTestAccessCookieValue,
  isTestAccessEnabled,
} from "@/modules/auth/services/test-access";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
    testAccess?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextValue = Array.isArray(resolvedSearchParams?.next)
    ? resolvedSearchParams?.next[0]
    : resolvedSearchParams?.next;
  const testAccessStatus = Array.isArray(resolvedSearchParams?.testAccess)
    ? resolvedSearchParams?.testAccess[0]
    : resolvedSearchParams?.testAccess;
  const nextPath = sanitizeRedirectPath(nextValue);
  const user = await getAuthenticatedUser();
  const cookieStore = await cookies();
  const hasTestAccess = hasTestAccessCookieValue(
    cookieStore.get(getTestAccessCookieName())?.value,
  );

  if (user || hasTestAccess) {
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

          {isTestAccessEnabled() ? (
            <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-stone-50 px-5 py-4">
              <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
                Acces test
              </p>
              <p className="mt-2 text-sm leading-7 text-stone-600">
                Pour tester l&apos;interface sans session reelle, active un acces
                lecture seule. Les routes protegees deviennent navigables avec les
                donnees de demonstration et les ecritures sensibles restent hors
                session.
              </p>
              <Link
                href={`/auth/test-access${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
                className="mt-4 inline-flex h-11 items-center justify-center rounded-full border border-stone-950 px-5 text-sm font-medium text-stone-950 transition hover:bg-stone-950 hover:text-white"
              >
                Activer l&apos;acces test
              </Link>
            </div>
          ) : null}

          {testAccessStatus === "disabled" ? (
            <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              L&apos;acces test est desactive dans cet environnement.
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
