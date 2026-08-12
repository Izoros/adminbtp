import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileCheck2,
  FolderKanban,
  HardHat,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { ProjectCarousel } from "@/components/marketing/project-carousel";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { LoginForm } from "@/modules/auth/components/login-form";
import {
  getLoginErrorMessage,
  sanitizeRedirectPath,
} from "@/modules/auth/services/session-navigation";

type HomePageProps = {
  searchParams?: Promise<{
    errorCode?: string | string[];
    next?: string | string[];
  }>;
};

const presentationItems = [
  {
    title: "Chantiers structures",
    description: "Organisations, roles, phases et priorites reunis dans un meme espace.",
    icon: FolderKanban,
  },
  {
    title: "Documents maitrises",
    description: "Pieces, validations, signatures et echanges rattaches au bon dossier.",
    icon: FileCheck2,
  },
  {
    title: "Pilotage securise",
    description: "Acces cloisonnes, actions sensibles tracees et arbitrage humain conserve.",
    icon: ShieldCheck,
  },
] as const;

const vlogEntries = [
  {
    number: "01",
    label: "Du plan au chantier",
    description: "Lire les choix techniques et suivre leur traduction sur le terrain.",
  },
  {
    number: "02",
    label: "Vie du projet",
    description: "Partager les jalons, les documents utiles et les decisions qui comptent.",
  },
  {
    number: "03",
    label: "Construire a Mayotte",
    description: "Mettre en avant des projets sobres, adaptes au climat et au contexte local.",
  },
] as const;

export default async function Home({ searchParams }: HomePageProps) {
  const [user, resolvedSearchParams] = await Promise.all([
    getAuthenticatedUser(),
    searchParams ? searchParams : Promise.resolve(undefined),
  ]);
  const errorCode = Array.isArray(resolvedSearchParams?.errorCode)
    ? resolvedSearchParams.errorCode[0]
    : resolvedSearchParams?.errorCode;
  const errorMessage = getLoginErrorMessage(errorCode);
  const nextValue = Array.isArray(resolvedSearchParams?.next)
    ? resolvedSearchParams.next[0]
    : resolvedSearchParams?.next;
  const nextPath = sanitizeRedirectPath(nextValue);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="AdminBTP, accueil">
            <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg">
              <Building2 className="size-5" />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-[-0.04em]">AdminBTP</span>
              <span className="block text-xs text-stone-500">Piloter. Tracer. Construire.</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-stone-600 md:flex" aria-label="Navigation publique">
            <a href="#plateforme" className="transition hover:text-stone-950">La plateforme</a>
            <a href="#vlog" className="transition hover:text-stone-950">Vlog</a>
            <a href="#projets" className="transition hover:text-stone-950">Projets</a>
          </nav>

          <Link
            href={user ? "/admin" : "#connexion"}
            className="inline-flex h-10 items-center justify-center rounded-full bg-stone-950 px-5 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            {user ? "Ouvrir AdminBTP" : "Se connecter"}
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-stone-200/80">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-emerald-900/10" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-20">
            <div className="flex flex-col justify-center">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.22em] text-primary uppercase">
                <HardHat className="size-4" />
                Gestion administrative et technique BTP
              </p>
              <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-[-0.065em] text-balance sm:text-6xl lg:text-7xl">
                Le chantier avance. L&apos;administratif aussi.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
                AdminBTP rassemble le suivi des chantiers, les documents, les validations
                et les relances dans un espace clair, pense pour les equipes du BTP.
              </p>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-stone-700">
                {["Multi-organisations", "Suivi chantier", "Validation humaine"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-700" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <section
              id="connexion"
              className="scroll-mt-6 rounded-2xl border border-border bg-card/95 p-6 shadow-xl backdrop-blur sm:p-8"
              aria-labelledby="connexion-title"
            >
              {user ? (
                <div className="flex h-full min-h-96 flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.22em] text-emerald-700 uppercase">
                      Session active
                    </p>
                    <h2 id="connexion-title" className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
                      Bienvenue dans AdminBTP.
                    </h2>
                    <p className="mt-4 leading-7 text-stone-600">
                      Votre session est deja ouverte. Reprenez directement le pilotage de vos dossiers.
                    </p>
                  </div>
                  <Link
                    href="/admin"
                    className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-medium text-primary-foreground transition hover:brightness-95"
                  >
                    Acceder au cockpit
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold tracking-[0.22em] text-stone-500 uppercase">
                    Espace securise
                  </p>
                  <h2 id="connexion-title" className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
                    Connexion a votre espace
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-stone-600">
                    Utilisez votre compte professionnel ou recevez un lien de connexion par email.
                  </p>
                  <div className="mt-7">
                    <LoginForm
                      loginPath="/"
                      nextPath={nextPath}
                      initialMessage={errorMessage}
                    />
                  </div>
                </>
              )}
            </section>
          </div>
        </section>

        <section id="plateforme" className="scroll-mt-8 bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">En bref</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                L&apos;essentiel du pilotage, sans multiplier les outils.
              </h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {presentationItems.map((item) => (
                <article key={item.title} className="rounded-2xl border border-border bg-card p-6">
                  <item.icon className="size-6 text-primary" aria-hidden="true" />
                  <h3 className="mt-6 text-xl font-semibold tracking-[-0.03em]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="vlog" className="scroll-mt-8 bg-stone-950 py-16 text-white lg:py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="text-xs font-semibold tracking-[0.22em] text-orange-300 uppercase">Vlog chantier</p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.055em]">
                  Les projets racontes simplement.
                </h2>
                <p className="mt-5 max-w-md leading-8 text-stone-400">
                  Un journal court pour montrer les etapes, expliquer les plans et partager
                  la realite des projets a Mayotte.
                </p>
              </div>
              <div className="divide-y divide-white/10 border-y border-white/10">
                {vlogEntries.map((entry) => (
                  <article key={entry.number} className="grid gap-3 py-6 sm:grid-cols-[4rem_0.75fr_1.25fr] sm:items-center">
                    <span className="font-mono text-sm text-orange-300">{entry.number}</span>
                    <h3 className="text-lg font-medium">{entry.label}</h3>
                    <p className="text-sm leading-6 text-stone-400">{entry.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="projets" className="scroll-mt-8 bg-background py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">Projets & architecture</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                  Concevoir pour le territoire mahorais.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-7 text-stone-600">
                Visuels de conception originaux illustrant une architecture tropicale, les plans et le suivi de chantier.
              </p>
            </div>
            <ProjectCarousel />
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} AdminBTP. Pilotage administratif et technique.</p>
          <p className="font-medium text-stone-800">Create and design par FAST976.yt</p>
        </div>
      </footer>
    </div>
  );
}
