import { ArrowRight, Building2, FileStack, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { SectionCard } from "@/components/ui/section-card";
import { dashboardHighlights, validationChecklist } from "@/config/dashboard";

export default function Home() {
  return (
    <AppShell>
      <div className="space-y-8">
        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(224,122,95,0.18),_transparent_32%),linear-gradient(135deg,#fffaf3_0%,#f7efe5_42%,#f1e4d1_100%)] p-8 shadow-[0_24px_80px_rgba(89,65,40,0.14)]">
            <div className="absolute inset-y-0 right-0 hidden w-48 bg-[radial-gradient(circle_at_center,_rgba(31,41,55,0.12),_transparent_70%)] lg:block" />
            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-stone-300/70 bg-white/75 px-3 py-1 text-xs font-medium tracking-[0.22em] text-stone-600 uppercase">
                <Sparkles className="size-3.5" />
                Phase 16 en preparation
              </div>
              <div className="max-w-2xl space-y-4">
                <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-5xl">
                  AdminBTP prend forme comme une plateforme modulaire BTP.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-stone-700 sm:text-lg">
                  Le socle livre deja le monorepo, l application Next.js, le design
                  system initial, la navigation principale, le branchement Supabase,
                  la mise en ligne Vercel et les premiers flux CRUD reels.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_14px_28px_rgba(224,122,95,0.25)] transition hover:brightness-95"
                >
                  Ouvrir la connexion
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/organizations"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-stone-200 bg-white px-5 text-sm font-medium text-stone-900 transition hover:bg-stone-50"
                >
                  Ouvrir les organisations
                </Link>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {dashboardHighlights.map((highlight) => (
                  <SectionCard
                    key={highlight.title}
                    title={highlight.title}
                    description={highlight.description}
                    tone={highlight.tone}
                  />
                ))}
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <p className="text-xs font-medium tracking-[0.2em] text-stone-500 uppercase">
                  Controles
                </p>
                <h2 className="mt-2 text-xl font-semibold text-stone-950">
                  Validation de phase
                </h2>
              </div>
              <ShieldCheck className="size-10 rounded-2xl bg-emerald-50 p-2.5 text-emerald-700" />
            </div>
            <ul className="mt-6 space-y-4">
              {validationChecklist.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-stone-200/80 bg-stone-50/80 px-4 py-3 text-sm text-stone-700"
                >
                  <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <Building2 className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-stone-950">Core</h3>
                <p className="text-sm text-stone-600">Auth, organisations, permissions.</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-stone-700">
              Le core reste strictement controle pour proteger le multi-tenant et
              les regles transverses.
            </p>
          </article>

          <article className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <FileStack className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-stone-950">Modules</h3>
                <p className="text-sm text-stone-600">Chantiers, documents, consulting, IA.</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-stone-700">
              Chaque module garde ses types, composants, services, hooks, tests et
              documentation pour permettre le travail en parallele.
            </p>
          </article>

          <article className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-stone-950">Securite</h3>
                <p className="text-sm text-stone-600">Controle des acces, audit et validation.</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-stone-700">
              Des la phase 0, la plateforme expose une base prete pour les tests de
              qualite, de typage et les audits de dependances.
            </p>
          </article>
        </section>
      </div>
    </AppShell>
  );
}
