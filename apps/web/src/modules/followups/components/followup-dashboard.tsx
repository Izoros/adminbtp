import {
  syncFollowupScheduleAction,
  updateFollowupStatusAction,
} from "@/modules/followups/services/followup-actions";
import type {
  FollowupDashboardData,
  FollowupFeedback,
  FollowupStatus,
} from "@/modules/followups/types/followup";

type FollowupDashboardProps = {
  initialData: FollowupDashboardData;
  currentPath: string;
  feedback?: FollowupFeedback;
};

const statusLabels: Record<FollowupStatus, string> = {
  scheduled: "Planifiee",
  sent: "Envoyee",
  done: "Traitee",
  cancelled: "Annulee",
};

const statusTransitions: Array<{
  status: FollowupStatus;
  label: string;
}> = [
  { status: "scheduled", label: "Replanifier" },
  { status: "sent", label: "Marquer envoyee" },
  { status: "done", label: "Marquer traitee" },
  { status: "cancelled", label: "Annuler" },
];

function feedbackClasses(tone: FollowupFeedback["tone"]) {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (tone === "error") {
    return "border-rose-200 bg-rose-50 text-rose-900";
  }

  return "border-sky-200 bg-sky-50 text-sky-900";
}

export function FollowupDashboard({
  initialData,
  currentPath,
  feedback,
}: FollowupDashboardProps) {
  const { situation, followups } = initialData;

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.07)]">
        <p className="text-xs font-medium tracking-[0.22em] text-stone-500 uppercase">
          Phase 8
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
          Relances decomptes et tresorerie
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-700">
          Une situation envoyee genere automatiquement un planning de relance a
          J+7, J+15, J+30 et J+45.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-stone-600">
          <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1">
            Source : {initialData.dataOrigin}
          </span>
          <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1">
            Relances : {initialData.persistenceMode}
          </span>
          {initialData.fallbackReason ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-900">
              {initialData.fallbackReason}
            </span>
          ) : null}
        </div>
        {feedback ? (
          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${feedbackClasses(feedback.tone)}`}
          >
            {feedback.message}
          </div>
        ) : null}
      </div>

      {!situation ? (
        <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white/70 p-8 text-sm text-stone-600">
          Aucune situation exploitable n&apos;est encore disponible sur le perimetre courant.
        </div>
      ) : null}

      {situation ? (
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
            Situation
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
            {situation.reference}
          </h2>
          <div className="mt-5 space-y-3 rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5 text-sm text-stone-700">
            <p>Client : {situation.customerName}</p>
            <p>Montant : {(situation.amountCents / 100).toFixed(2)} {situation.currencyCode}</p>
            <p>Emission : {situation.issuedOn}</p>
            <p>Echeance : {situation.dueOn}</p>
            <p>Statut : {situation.status}</p>
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
            Planning de relance
          </p>
          <div className="mt-5 space-y-3">
            {initialData.dataOrigin === "supabase" &&
            initialData.persistenceMode !== "persisted" ? (
              <form action={syncFollowupScheduleAction} className="mb-4">
                <input type="hidden" name="situationId" value={situation.id} />
                <input type="hidden" name="organizationId" value={situation.organizationId} />
                <input type="hidden" name="returnTo" value={currentPath} />
                <button
                  type="submit"
                  className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
                >
                  Persister le planning de relance
                </button>
              </form>
            ) : null}
            {followups.map((followup) => (
              <div
                key={followup.id}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-700"
              >
                <p className="font-medium text-stone-950">{followup.stepLabel}</p>
                <p className="mt-2">Date planifiee : {followup.scheduledFor}</p>
                <p className="mt-1">Statut : {statusLabels[followup.status]}</p>
                {initialData.dataOrigin === "supabase" &&
                initialData.persistenceMode === "persisted" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {statusTransitions
                      .filter((transition) => transition.status !== followup.status)
                      .map((transition) => (
                        <form key={transition.status} action={updateFollowupStatusAction}>
                          <input type="hidden" name="followupId" value={followup.id} />
                          <input
                            type="hidden"
                            name="organizationId"
                            value={followup.organizationId}
                          />
                          <input type="hidden" name="nextStatus" value={transition.status} />
                          <input type="hidden" name="returnTo" value={currentPath} />
                          <button
                            type="submit"
                            className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-medium text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
                          >
                            {transition.label}
                          </button>
                        </form>
                      ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </article>
      </div>
      ) : null}
    </section>
  );
}
