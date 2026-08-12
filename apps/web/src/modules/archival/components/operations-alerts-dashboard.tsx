import { BellRing, CheckCircle2, CircleAlert, Clock3, Send } from "lucide-react";

import type {
  OperationsAlertsData,
  OperationsAlertStatus,
  OperationsAlertView,
} from "@/modules/archival/types/operations-alert";

const statusLabels: Record<OperationsAlertStatus, string> = {
  pending: "En attente",
  dispatching: "Envoi en cours",
  delivered: "Livree",
  failed: "Echec",
};

const statusStyles: Record<OperationsAlertStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  dispatching: "bg-sky-100 text-sky-800",
  delivered: "bg-emerald-100 text-emerald-800",
  failed: "bg-rose-100 text-rose-800",
};

function formatDate(value: string | null) {
  if (!value) {
    return "Non disponible";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Indian/Mayotte",
  }).format(new Date(value));
}

function AlertCard({ alert }: { alert: OperationsAlertView }) {
  return (
    <article className="rounded-[1.5rem] border border-stone-200/80 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[alert.status]}`}
            >
              {statusLabels[alert.status]}
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700 uppercase">
              {alert.severity}
            </span>
          </div>
          <h3 className="text-base font-semibold text-stone-950">{alert.title}</h3>
          <p className="text-xs text-stone-500">
            {alert.attempts} tentative(s) · evenement {formatDate(alert.occurredAt)}
          </p>
        </div>
        <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-2 text-xs lg:min-w-80">
          <div>
            <dt className="text-stone-500">Dernier essai</dt>
            <dd className="font-medium text-stone-900">{formatDate(alert.lastAttemptAt)}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Livraison</dt>
            <dd className="font-medium text-stone-900">{formatDate(alert.deliveredAt)}</dd>
          </div>
        </dl>
      </div>
      {alert.lastError ? (
        <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {alert.lastError}
        </p>
      ) : null}
    </article>
  );
}

export function OperationsAlertsDashboard({ data }: { data: OperationsAlertsData }) {
  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-violet-200 bg-violet-50/80 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-violet-800 uppercase">
              <BellRing className="size-4" />
              Outbox d&apos;exploitation
            </span>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-stone-950">
              Livraisons des alertes archives
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-700">
              {data.sourceMessage} Les donnees sensibles des archives ne quittent pas AdminBTP.
            </p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-sm text-stone-600">
            Derniere lecture : {formatDate(data.updatedAt)}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Alertes", value: data.totalAlerts, icon: BellRing },
          { label: "Actives", value: data.activeAlerts, icon: Clock3 },
          { label: "Livrees", value: data.deliveredAlerts, icon: CheckCircle2 },
          { label: "En echec", value: data.failedAlerts, icon: CircleAlert },
        ].map((metric) => (
          <article
            key={metric.label}
            className="rounded-[1.5rem] border border-stone-200/80 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)]"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-stone-950 p-3 text-white">
                <metric.icon className="size-5" />
              </div>
              <span className="text-3xl font-semibold text-stone-950">{metric.value}</span>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-stone-950">{metric.label}</h3>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Send className="size-5 text-stone-600" />
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-stone-950">
            Historique des livraisons
          </h2>
        </div>
        {data.alerts.length > 0 ? (
          <div className="space-y-3">
            {data.alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-white/70 p-8 text-center text-sm text-stone-600">
            Aucune alerte n&apos;a encore ete reservee ou envoyee.
          </div>
        )}
      </section>
    </div>
  );
}
