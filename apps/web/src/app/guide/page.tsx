import { ArrowRight, BookOpenCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { onboardingGuideSteps } from "@/components/onboarding/guide-content";
import { TutorialProgress } from "@/components/onboarding/tutorial-progress";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function GuidePage() {
  const user = await getAuthenticatedUser();

  return (
    <AppShell eyebrow="Aide et prise en main" title="Didacticiel AdminBTP">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.18),_transparent_32%),linear-gradient(135deg,#fffaf4_0%,#f6eddf_48%,#ecdfcc_100%)] p-8 shadow-[0_24px_80px_rgba(89,65,40,0.14)]">
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-teal-800 uppercase">
              <BookOpenCheck className="size-4" />
              Parcours recommande
            </span>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-stone-950 sm:text-5xl">
              Prendre AdminBTP en main sans oublier une etape critique.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-stone-700 sm:text-lg">
              Suivez ce parcours dans l&apos;ordre. Chaque etape indique le resultat attendu
              et conduit directement au bon module. Une configuration visible ne vaut
              pas synchronisation reussie : les integrations externes doivent toujours
              etre testees dans un environnement controle.
            </p>
          </div>
        </section>

        <TutorialProgress
          userKey={user?.id ?? "visiteur"}
          items={onboardingGuideSteps.map((step) => ({
            id: step.id,
            title: step.shortTitle,
          }))}
        />

        <section className="grid gap-5 xl:grid-cols-2">
          {onboardingGuideSteps.map((step, index) => (
            <article
              key={step.id}
              id={step.id}
              className="scroll-mt-6 rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-stone-950 p-3 text-white">
                  <step.icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
                    Etape {index + 1}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-stone-950">
                    {step.title}
                  </h3>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-stone-700">{step.description}</p>
              <div className="mt-4 flex items-start gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                <span>Resultat attendu : {step.outcome}</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={step.href}
                  className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
                >
                  {step.actionLabel}
                  <ArrowRight className="size-4" />
                </Link>
                {"secondaryHref" in step ? (
                  <Link
                    href={step.secondaryHref}
                    className="inline-flex items-center rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-900 transition hover:bg-stone-50"
                  >
                    {step.secondaryActionLabel}
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
