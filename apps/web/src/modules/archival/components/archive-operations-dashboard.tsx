import {
  ArchiveRestore,
  CheckCircle2,
  CircleAlert,
  Clock3,
  DatabaseBackup,
  ShieldCheck,
} from "lucide-react";

import type {
  ArchiveOperationsData,
  ArchiveOperationsHealth,
  ArchiveRunView,
} from "@/modules/archival/types/archive-operations";

const healthStyles: Record<
  ArchiveOperationsHealth,
  { badge: string; panel: string }
> = {
  healthy: {
    badge: "bg-emerald-100 text-emerald-800",
    panel: "border-emerald-200 bg-emerald-50/80",
  },
  attention: {
    badge: "bg-amber-100 text-amber-800",
    panel: "border-amber-200 bg-amber-50/80",
  },
  critical: {
    badge: "bg-rose-100 text-rose-800",
    panel: "border-rose-200 bg-rose-50/80",
  },
  empty: {
    badge: "bg-stone-100 text-stone-700",
    panel: "border-stone-200 bg-stone-50/80",
  },
  unavailable: {
    badge: "bg-stone-100 text-stone-700",
    panel: "border-stone-200 bg-stone-50/80",
  },
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

function formatBytes(value: number | null) {
  if (value === null) {
    return "Taille inconnue";
  }

  if (value < 1_024) {
    return `${value} o`;
  }

  return `${(value / 1_024).toFixed(1)} Ko`;
}

function getRunPresentation(run: ArchiveRunView) {
  if (run.isStalled) {
    return {
      label: "Bloquee",
      icon: CircleAlert,
      style: "bg-rose-100 text-rose-800",
    };
  }

  if (run.status === "succeeded") {
    return {
      label: "Verifiee",
      icon: CheckCircle2,
      style: "bg-emerald-100 text-emerald-800",
    };
  }

  if (run.status === "failed") {
    return {
      label: "Echec",
      icon: CircleAlert,
      style: "bg-rose-100 text-rose-800",
    };
  }

  return {
    label: "En cours",
    icon: Clock3,
    style: "bg-sky-100 text-sky-800",
  };
}

function ArchiveRunCard({ run }: { run: ArchiveRunView }) {
  const presentation = getRunPresentation(run);

  return (
    <article className="rounded-[1.5rem] border border-stone-200/80 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${presentation.style}`}
            >
              <presentation.icon className="size-3.5" />
              {presentation.label}
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700 uppercase">
              {run.storageMode}
            </span>
          </div>
          <h3 className="truncate text-base font-semibold text-stone-950">
            {run.fileName}
          </h3>
          <p className="break-all text-xs leading-5 text-stone-500">{run.storagePath}</p>
        </div>

        <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-2 text-sm lg:min-w-80">
          <div>
            <dt className="text-stone-500">Generation</dt>
            <dd className="font-medium text-stone-900">{formatDate(run.generatedAt)}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Verification</dt>
            <dd className="font-medium text-stone-900">{formatDate(run.verifiedAt)}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Volume</dt>
            <dd className="font-medium text-stone-900">{formatBytes(run.byteLength)}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Checksum</dt>
            <dd className="font-mono text-xs font-medium text-stone-900">
              {run.sha256 ? `${run.sha256.slice(0, 12)}…` : "Non disponible"}
            </dd>
          </div>
        </dl>
      </div>

      {run.errorMessage ? (
        <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800">
          {run.errorMessage}
        </p>
      ) : null}
    </article>
  );
}

export function ArchiveOperationsDashboard({ data }: { data: ArchiveOperationsData }) {
  const styles = healthStyles[data.health];

  return (
    <div className="space-y-6">
      <section className={`rounded-[1.75rem] border p-6 ${styles.panel}`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${styles.badge}`}
            >
              <ShieldCheck className="size-4" />
              {data.healthLabel}
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-stone-950">
                Surveillance des sauvegardes longue duree
              </h2>
              <p className="mt-2 text-sm leading-7 text-stone-700">{data.sourceMessage}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-sm text-stone-600">
            Derniere lecture : {formatDate(data.updatedAt)}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Executions chargees",
            value: data.totalRuns,
            detail: "50 dernieres maximum",
            icon: DatabaseBackup,
          },
          {
            label: "Archives verifiees",
            value: data.succeededRuns,
            detail: `Derniere : ${formatDate(data.lastSucceededAt)}`,
            icon: CheckCircle2,
          },
          {
            label: "Echecs",
            value: data.failedRuns,
            detail: "Dans l'historique charge",
            icon: CircleAlert,
          },
          {
            label: "Executions bloquees",
            value: data.stalledRuns,
            detail: "En cours depuis plus de 15 min",
            icon: Clock3,
          },
        ].map((metric) => (
          <article
            key={metric.label}
            className="rounded-[1.5rem] border border-stone-200/80 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)]"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="rounded-2xl bg-stone-950 p-3 text-white">
                <metric.icon className="size-5" />
              </div>
              <span className="text-3xl font-semibold tracking-[-0.05em] text-stone-950">
                {metric.value}
              </span>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-stone-950">{metric.label}</h3>
            <p className="mt-1 text-xs leading-5 text-stone-500">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <ArchiveRestore className="size-5 text-stone-600" />
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-stone-950">
              Historique des executions
            </h2>
            <p className="text-sm text-stone-600">
              Les chemins et checksums sont visibles uniquement par les administrateurs plateforme.
            </p>
          </div>
        </div>

        {data.runs.length > 0 ? (
          <div className="space-y-3">
            {data.runs.map((run) => (
              <ArchiveRunCard key={run.id} run={run} />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-white/70 p-8 text-center text-sm leading-7 text-stone-600">
            Aucune execution n&apos;est encore journalisee. Le prochain cron actif creera la premiere entree.
          </div>
        )}
      </section>
    </div>
  );
}
