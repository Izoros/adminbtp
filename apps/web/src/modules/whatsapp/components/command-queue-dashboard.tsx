import {
  BotOff,
  CheckCircle2,
  CircleAlert,
  Clock3,
  MessageCircleMore,
  ShieldCheck,
} from "lucide-react";

import type {
  WhatsAppCommandQueueData,
  WhatsAppCommandQueueItem,
  WhatsAppCommandStatus,
} from "@/modules/whatsapp/types/command";

const statusPresentation: Record<
  WhatsAppCommandStatus,
  { label: string; style: string }
> = {
  pending_review: {
    label: "A revoir",
    style: "bg-amber-100 text-amber-800",
  },
  approved: { label: "Approuvee", style: "bg-sky-100 text-sky-800" },
  rejected: { label: "Refusee", style: "bg-stone-200 text-stone-700" },
  processing: { label: "En traitement", style: "bg-violet-100 text-violet-800" },
  completed: { label: "Terminee", style: "bg-emerald-100 text-emerald-800" },
  failed: { label: "Echec", style: "bg-rose-100 text-rose-800" },
};

const kindLabels = {
  help: "Aide",
  status_check: "Etat du service",
  archive_status: "Etat des archives",
  development_request: "Demande de developpement",
} as const;

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
function CommandCard({ command }: { command: WhatsAppCommandQueueItem }) {
  const status = statusPresentation[command.status];

  return (
    <article className="rounded-[1.5rem] border border-stone-200/80 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${status.style}`}
            >
              {status.label}
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
              {kindLabels[command.commandKind]}
            </span>
          </div>
          <p className="max-w-4xl whitespace-pre-wrap text-sm leading-7 text-stone-800">
            {command.commandText}
          </p>
          <p className="font-mono text-xs text-stone-500">
            Expediteur {command.senderFingerprint.slice(0, 12)}…
          </p>
        </div>
        <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-2 text-xs lg:min-w-80">
          <div>
            <dt className="text-stone-500">Reception</dt>
            <dd className="font-medium text-stone-900">
              {formatDate(command.receivedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Expiration</dt>
            <dd className="font-medium text-stone-900">
              {formatDate(command.retentionUntil)}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

export function CommandQueueDashboard({
  data,
}: {
  data: WhatsAppCommandQueueData;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-sky-200 bg-sky-50/80 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-sky-800 uppercase">
              <ShieldCheck className="size-4" />
              File sous validation humaine
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-stone-950">
                Commandes recues depuis WhatsApp
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-700">
                {data.sourceMessage} Aucun texte recu ici ne declenche automatiquement
                une action, une mutation ou une commande systeme.
              </p>
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
            label: "Demandes chargees",
            value: data.totalCommands,
            icon: MessageCircleMore,
          },
          { label: "En attente", value: data.pendingCommands, icon: Clock3 },
          { label: "Terminees", value: data.completedCommands, icon: CheckCircle2 },
          { label: "En echec", value: data.failedCommands, icon: CircleAlert },
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
            <h3 className="mt-4 text-sm font-semibold text-stone-950">
              {metric.label}
            </h3>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <BotOff className="size-5 text-stone-600" />
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-stone-950">
              Revue des demandes
            </h2>
            <p className="text-sm text-stone-600">
              Le numero brut n&apos;est jamais affiche ni enregistre dans cette file.
            </p>
          </div>
        </div>

        {data.commands.length > 0 ? (
          <div className="space-y-3">
            {data.commands.map((command) => (
              <CommandCard key={command.id} command={command} />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-white/70 p-8 text-center text-sm leading-7 text-stone-600">
            Aucune commande WhatsApp n&apos;est encore en attente de revue.
          </div>
        )}
      </section>
    </div>
  );
}
