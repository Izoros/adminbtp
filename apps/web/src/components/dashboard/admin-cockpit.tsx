import { AlertTriangle, ArrowUpRight, BriefcaseBusiness, FolderKanban, Wallet } from "lucide-react";

import {
  adminAlerts,
  adminKanbanColumns,
  adminLoadSeries,
  adminMetrics,
  adminRevenueSeries,
} from "@/config/dashboard";
import { cn } from "@/lib/utils";

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

export function AdminCockpit() {
  const consultingPoints = buildPolylinePoints(
    adminLoadSeries.map((item) => item.consulting),
    320,
    110,
  );
  const documentPoints = buildPolylinePoints(
    adminLoadSeries.map((item) => item.documents),
    320,
    110,
  );
  const emailPoints = buildPolylinePoints(
    adminLoadSeries.map((item) => item.emails),
    320,
    110,
  );

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminMetrics.map((metric) => (
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
                Charge hebdomadaire AdminBTP
              </h2>
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

          <div className="mt-5 grid gap-3 sm:grid-cols-5">
            {adminLoadSeries.map((item) => (
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
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <Wallet className="size-5" />
            </div>
          </div>

          <div className="mt-6 grid h-64 grid-cols-6 items-end gap-3 rounded-[1.5rem] border border-stone-200 bg-[linear-gradient(180deg,#fbf8f1_0%,#f5eee2_100%)] p-5">
            {adminRevenueSeries.map((item) => (
              <div key={item.label} className="flex h-full flex-col justify-end gap-2">
                <div className="flex items-end justify-center gap-1">
                  <div
                    className="w-4 rounded-t-full bg-stone-300"
                    style={{ height: `${item.committed * 3}px` }}
                  />
                  <div
                    className="w-4 rounded-t-full bg-primary"
                    style={{ height: `${item.invoiced * 3}px` }}
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
            {adminAlerts.map((alert) => (
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
            {adminKanbanColumns.map((column) => (
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
