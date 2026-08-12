import { CheckCircle2, CircleAlert, CircleOff, PlugZap } from "lucide-react";

import type {
  IntegrationReadinessData,
  IntegrationReadinessStatus,
} from "@/modules/settings/types/integration-readiness";

const statusPresentation: Record<
  IntegrationReadinessStatus,
  { icon: typeof CheckCircle2; style: string }
> = {
  ready: { icon: CheckCircle2, style: "bg-emerald-100 text-emerald-800" },
  attention: { icon: CircleAlert, style: "bg-amber-100 text-amber-800" },
  inactive: { icon: CircleOff, style: "bg-stone-200 text-stone-700" },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Indian/Mayotte",
  }).format(new Date(value));
}

export function IntegrationReadinessDashboard({
  data,
}: {
  data: IntegrationReadinessData;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-teal-200 bg-teal-50/80 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-teal-800 uppercase">
              <PlugZap className="size-4" />
              Etat de configuration
            </span>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-stone-950">
              {data.readyGroups} integration(s) sur {data.totalGroups} prete(s) a tester
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-700">
              Cette vue confirme uniquement la presence des variables. Elle n&apos;affiche
              aucun secret et ne remplace pas un test de connexion reel.
            </p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-sm text-stone-600">
            Lecture : {formatDate(data.updatedAt)}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {data.groups.map((group) => {
          const presentation = statusPresentation[group.status];

          return (
            <article
              key={group.id}
              className="rounded-[1.5rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-stone-950">{group.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-stone-600">{group.description}</p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${presentation.style}`}
                >
                  <presentation.icon className="size-3.5" />
                  {group.statusLabel}
                </span>
              </div>
              <ul className="mt-5 space-y-2">
                {group.checks.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-stone-50 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-stone-800">{item.label}</span>
                    <span className={item.ready ? "text-emerald-700" : "text-stone-500"}>
                      {item.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>
    </div>
  );
}
