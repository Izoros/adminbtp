import type { FollowupDashboardData } from "@/modules/followups/types/followup";

type FollowupDashboardProps = {
  initialData: FollowupDashboardData;
};

export function FollowupDashboard({ initialData }: FollowupDashboardProps) {
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
          {initialData.fallbackReason ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-900">
              {initialData.fallbackReason}
            </span>
          ) : null}
        </div>
      </div>

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
            {followups.map((followup) => (
              <div
                key={followup.id}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-700"
              >
                <p className="font-medium text-stone-950">{followup.stepLabel}</p>
                <p className="mt-2">Date planifiee : {followup.scheduledFor}</p>
                <p className="mt-1">Statut : {followup.status}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
