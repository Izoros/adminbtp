import Link from "next/link";
import { ArchiveRestore, ArrowRight, Bot, BriefcaseBusiness, Wallet } from "lucide-react";

import { AdminCockpit } from "@/components/dashboard/admin-cockpit";
import { loadAdminCockpitData } from "@/components/dashboard/admin-cockpit-data";
import { AppShell } from "@/components/layout/app-shell";

const adminRangeOptions = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "90d", label: "90 jours" },
] as const;

type AdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const cockpitData = await loadAdminCockpitData({
    range: resolvedSearchParams.range,
  });

  return (
    <AppShell eyebrow="Pilotage operationnel AdminBTP" title="Cockpit admin">
      <div className="space-y-8">
        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_28%),linear-gradient(135deg,#fffaf4_0%,#f8f0e3_44%,#efe2cf_100%)] p-8 shadow-[0_24px_80px_rgba(89,65,40,0.14)]">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-stone-300/70 bg-white/80 px-3 py-1 text-xs font-medium tracking-[0.2em] text-stone-600 uppercase">
                Vue direction
              </div>
              <div className="max-w-3xl space-y-4">
                <h2 className="text-4xl font-semibold tracking-[-0.05em] text-stone-950 sm:text-5xl">
                  Piloter AdminBTP comme un centre d&apos;operations BTP.
                </h2>
                <p className="max-w-2xl text-base leading-8 text-stone-700 sm:text-lg">
                  Ce cockpit centralise la charge documentaire, les validations,
                  la tresorerie, les flux d&apos;expertise et les alertes d&apos;exploitation
                  pour aider l&apos;equipe a prioriser vite.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/projects"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_14px_28px_rgba(224,122,95,0.25)] transition hover:brightness-95"
                >
                  Ouvrir les chantiers
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/followups"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-stone-200 bg-white px-5 text-sm font-medium text-stone-900 transition hover:bg-stone-50"
                >
                  Ouvrir la tresorerie
                </Link>
                <Link
                  href="/admin/archives"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-5 text-sm font-medium text-stone-900 transition hover:bg-stone-50"
                >
                  <ArchiveRestore className="size-4" />
                  Surveiller les archives
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {adminRangeOptions.map((option) => {
                  const isActive = cockpitData.range === option.value;

                  return (
                    <Link
                      key={option.value}
                      href={`/admin?range=${option.value}`}
                      className={
                        isActive
                          ? "inline-flex h-10 items-center justify-center rounded-full bg-stone-950 px-4 text-sm font-medium text-stone-50"
                          : "inline-flex h-10 items-center justify-center rounded-full border border-stone-200 bg-white/90 px-4 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                      }
                    >
                      {option.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="grid gap-4">
            <article className="rounded-[1.75rem] border border-stone-200/80 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                  <BriefcaseBusiness className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-950">Vue exploitation</p>
                  <p className="text-sm text-stone-600">
                    Charge, relances et arbitrages sur {cockpitData.rangeLabel.toLowerCase()}.
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-stone-200/80 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-950">Vue cash</p>
                  <p className="text-sm text-stone-600">
                    Engagement, facture et relances sur la fenetre en cours.
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-stone-200/80 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
                  <Bot className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-950">Vue IA & expertise</p>
                  <p className="text-sm text-stone-600">
                    Validation humaine et missions de conseil, mises a jour {cockpitData.updatedAtLabel}.
                  </p>
                </div>
              </div>
            </article>
          </aside>
        </section>

        <AdminCockpit data={cockpitData} />
      </div>
    </AppShell>
  );
}
