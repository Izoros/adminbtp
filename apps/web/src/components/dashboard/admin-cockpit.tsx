import { AlertTriangle, ArrowUpRight, BriefcaseBusiness, FolderKanban, Wallet } from "lucide-react";
import Link from "next/link";

import {
  adminAlerts,
  adminKanbanColumns,
  adminLoadSeries,
  adminMetrics,
  adminRevenueSeries,
} from "@/config/dashboard";
import { cn } from "@/lib/utils";
import type { AdminCockpitData } from "@/components/dashboard/admin-cockpit.types";

const metricToneClasses = {
  warm: "border-amber-200/80 bg-white text-stone-950",
  ink: "border-slate-200/80 bg-slate-950 text-slate-50",
  sage: "border-emerald-200/80 bg-emerald-50/90 text-emerald-950",
} as const;

const alertToneClasses = {
  amber: "border-amber-200 bg-amber-50 text-amber-950",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-950",
  rose: "border-rose-200 bg-rose-50 text-rose-950",
} as const;

const columnAccentClasses = {
  amber: "border-amber-200 bg-amber-50/70",
  emerald: "border-emerald-200 bg-emerald-50/70",
  rose: "border-rose-200 bg-rose-50/70",
  sky: "border-sky-200 bg-sky-50/70",
} as const;

function buildPolylinePoints(values: number[], width: number, height: number) {
  const maxValue = Math.max(...values, 1);

  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - (value / maxValue) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

function buildBarHeight(value: number, values: number[]) {
  const maxValue = Math.max(...values, 1);
  return `${Math.max((value / maxValue) * 180, value > 0 ? 18 : 8)}px`;
}

export function AdminCockpit({ data }: { data?: AdminCockpitData }) {
  const metrics = data?.metrics ?? adminMetrics;
  const overviewCards = data?.overviewCards ?? [];
  const priorities = data?.priorities ?? [];
  const healthItems = data?.healthItems ?? [];
  const quickActions = data?.quickActions ?? [];
  const organizationFocus = data?.organizationFocus ?? [];
  const projectFocus = data?.projectFocus ?? [];
  const loadSeries = data?.loadSeries ?? adminLoadSeries;
  const revenueSeries = data?.revenueSeries ?? adminRevenueSeries;
  const alerts = data?.alerts ?? adminAlerts;
  const kanbanColumns = data?.kanbanColumns ?? adminKanbanColumns;
  const source = data?.source ?? "demo";
  const rangeLabel = data?.rangeLabel ?? "30 derniers jours";
  const updatedAtLabel = data?.updatedAtLabel ?? "";
  const sourceMessage =
    data?.sourceMessage ??
    "Affichage des indicateurs de demonstration pour le cockpit admin.";
  const consultingPoints = buildPolylinePoints(
    loadSeries.map((item) => item.consulting),
    320,
    110,
  );
  const documentPoints = buildPolylinePoints(
    loadSeries.map((item) => item.documents),
    320,
    110,
  );
  const emailPoints = buildPolylinePoints(
    loadSeries.map((item) => item.emails),
    320,
    110,
  );
  const revenueValues = revenueSeries.flatMap((item) => [item.committed, item.invoiced]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-stone-200/80 bg-white/90 px-5 py-4 text-sm text-stone-700 shadow-[0_12px_32px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
            Source cockpit
          </p>
          <p className="mt-1 leading-6">{sourceMessage}</p>
        </div>
        <span
          className={cn(
            "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]",
            source === "supabase"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700",
          )}
        >
          {source === "supabase" ? "Supabase" : "Demonstration"}
        </span>
      </div>

      {overviewCards.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-4">
          {overviewCards.map((card) => (
            <article
              key={card.title}
              className={cn(
                "rounded-[1.5rem] border p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]",
                metricToneClasses[card.tone],
              )}
            >
              <p className="text-xs font-medium tracking-[0.18em] uppercase opacity-70">
                {card.title}
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{card.value}</p>
              <p className="mt-3 text-sm opacity-80">{card.detail}</p>
            </article>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className={cn(
              "rounded-[1.75rem] border p-5 shadow-[0_18px_36px_rgba(15,23,42,0.06)]",
              metricToneClasses[metric.tone],
            )}
          >
            <p className="text-xs font-medium tracking-[0.18em] uppercase opacity-70">
              {metric.label}
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
              {metric.value}
            </p>
            <p className="mt-3 inline-flex items-center gap-2 text-sm opacity-80">
              <ArrowUpRight className="size-4" />
              {metric.delta}
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[1.9rem] border border-stone-200/80 bg-white p-6 shadow-[0_22px_56px_rgba(15,23,42,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
                Flux operatoire
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
                Charge operationnelle AdminBTP
              </h2>
              <p className="mt-2 text-sm text-stone-600">
                Fenetre active : {rangeLabel}
                {updatedAtLabel ? ` - maj ${updatedAtLabel}` : ""}
              </p>
            </div>
            <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
              <BriefcaseBusiness className="size-5" />
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-stone-200 bg-[linear-gradient(180deg,#fcfaf7_0%,#f6f1ea_100%)] p-5">
            <svg viewBox="0 0 320 120" className="h-36 w-full">
              <path d="M0 110 H320" stroke="#d6d3d1" strokeWidth="1" strokeDasharray="4 4" />
              <path
                d={`M ${emailPoints}`}
                fill="none"
                stroke="#c2410c"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d={`M ${documentPoints}`}
                fill="none"
                stroke="#0f766e"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d={`M ${consultingPoints}`}
                fill="none"
                stroke="#7c3aed"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-stone-600">
              <span className="inline-flex items-center gap-2">
                <span className="size-2 rounded-full bg-orange-700" />
                Emails entrants
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-2 rounded-full bg-teal-700" />
                Documents traites
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-2 rounded-full bg-violet-700" />
                Dossiers expertise
              </span>
            </div>
          </div>

          <div
            className="mt-5 grid gap-3"
            style={{ gridTemplateColumns: `repeat(${Math.max(loadSeries.length, 1)}, minmax(0, 1fr))` }}
          >
            {loadSeries.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-700"
              >
                <p className="font-medium text-stone-950">{item.label}</p>
                <p className="mt-2">Emails : {item.emails}</p>
                <p>Docs : {item.documents}</p>
                <p>Conseil : {item.consulting}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.9rem] border border-stone-200/80 bg-white p-6 shadow-[0_22px_56px_rgba(15,23,42,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
                Tresorerie et ventes
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
                Engagement vs facture
              </h2>
              <p className="mt-2 text-sm text-stone-600">Lecture sur {rangeLabel.toLowerCase()}.</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <Wallet className="size-5" />
            </div>
          </div>

          <div
            className="mt-6 grid h-64 items-end gap-3 rounded-[1.5rem] border border-stone-200 bg-[linear-gradient(180deg,#fbf8f1_0%,#f5eee2_100%)] p-5"
            style={{ gridTemplateColumns: `repeat(${Math.max(revenueSeries.length, 1)}, minmax(0, 1fr))` }}
          >
            {revenueSeries.map((item) => (
              <div key={item.label} className="flex h-full flex-col justify-end gap-2">
                <div className="flex items-end justify-center gap-1">
                  <div
                    className="w-4 rounded-t-full bg-stone-300"
                    style={{ height: buildBarHeight(item.committed, revenueValues) }}
                  />
                  <div
                    className="w-4 rounded-t-full bg-primary"
                    style={{ height: buildBarHeight(item.invoiced, revenueValues) }}
                  />
                </div>
                <p className="text-center text-xs font-medium text-stone-600">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-stone-600">
            <span className="inline-flex items-center gap-2">
              <span className="size-2 rounded-full bg-stone-300" />
              Engagé
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              Facturé
            </span>
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr_0.9fr]">
        <article className="rounded-[1.9rem] border border-stone-200/80 bg-white p-6 shadow-[0_22px_56px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
            Priorites direction
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
            Decider vite
          </h2>

          <div className="mt-5 space-y-3">
            {priorities.map((priority) => (
              <div
                key={priority.title}
                className={cn(
                  "rounded-[1.3rem] border p-4",
                  alertToneClasses[priority.tone],
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{priority.title}</p>
                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-stone-700">
                    {priority.emphasis}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 opacity-85">{priority.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.9rem] border border-stone-200/80 bg-white p-6 shadow-[0_22px_56px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
            Sante plateforme
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
            Radar socle
          </h2>

          <div className="mt-5 space-y-3">
            {healthItems.map((item) => (
              <article
                key={item.label}
                className={cn(
                  "rounded-[1.3rem] border p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]",
                  metricToneClasses[item.tone],
                )}
              >
                <p className="text-xs font-medium uppercase tracking-[0.16em] opacity-70">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{item.value}</p>
                <p className="mt-2 text-sm opacity-80">{item.detail}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="rounded-[1.9rem] border border-stone-200/80 bg-white p-6 shadow-[0_22px_56px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
            Actions rapides
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
            Basculer en execution
          </h2>

          <div className="mt-5 space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={cn(
                  "block rounded-[1.3rem] border p-4 transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(15,23,42,0.08)]",
                  metricToneClasses[action.tone],
                )}
              >
                <p className="font-medium">{action.label}</p>
                <p className="mt-2 text-sm opacity-80">{action.detail}</p>
              </Link>
            ))}
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[1.9rem] border border-stone-200/80 bg-white p-6 shadow-[0_22px_56px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
            Focus portefeuille
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
            Organisations sous charge
          </h2>

          <div className="mt-5 space-y-3">
            {organizationFocus.map((item) => (
              <Link
                key={item.title}
                href={item.href ?? "/organizations"}
                className={cn(
                  "block rounded-[1.3rem] border p-4 transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(15,23,42,0.08)]",
                  metricToneClasses[item.tone],
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] opacity-70">
                      {item.subtitle}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-stone-700">
                    {item.stat}
                  </span>
                </div>
                <p className="mt-3 text-sm opacity-80">{item.detail}</p>
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-[1.9rem] border border-stone-200/80 bg-white p-6 shadow-[0_22px_56px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
            Focus chantiers
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
            Projets les plus exposes
          </h2>

          <div className="mt-5 space-y-3">
            {projectFocus.map((item) => (
              <Link
                key={item.title}
                href={item.href ?? "/projects"}
                className={cn(
                  "block rounded-[1.3rem] border p-4 transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(15,23,42,0.08)]",
                  metricToneClasses[item.tone],
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] opacity-70">
                      {item.subtitle}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-stone-700">
                    {item.stat}
                  </span>
                </div>
                <p className="mt-3 text-sm opacity-80">{item.detail}</p>
              </Link>
            ))}
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[1.9rem] border border-stone-200/80 bg-white p-6 shadow-[0_22px_56px_rgba(15,23,42,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
                Alertes direction
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
                Points a arbitrer
              </h2>
            </div>
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-700">
              <AlertTriangle className="size-5" />
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.title}
                className={cn(
                  "rounded-[1.4rem] border px-4 py-4 text-sm",
                  alertToneClasses[alert.tone],
                )}
              >
                <p className="font-medium">{alert.title}</p>
                <p className="mt-2 leading-6 opacity-85">{alert.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.9rem] border border-stone-200/80 bg-white p-6 shadow-[0_22px_56px_rgba(15,23,42,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
                Kanban d exploitation
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
                File active AdminBTP
              </h2>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
              <FolderKanban className="size-5" />
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-4">
            {kanbanColumns.map((column) => (
              <div
                key={column.id}
                className={cn(
                  "rounded-[1.5rem] border p-4",
                  columnAccentClasses[column.accent],
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-stone-950">{column.title}</p>
                  <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-700">
                    {column.cards.length}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {column.cards.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-[1.2rem] border border-white/80 bg-white/90 p-3 text-sm text-stone-700 shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                    >
                      <p className="font-medium text-stone-950">{card.title}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-stone-500">
                        {card.meta}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-stone-600">
                        <span>{card.owner}</span>
                        <span>{card.eta}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
