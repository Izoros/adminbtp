import type { OdooMappingBoardData } from "@/modules/settings/types/odoo";

type OdooMappingBoardProps = {
  initialData: OdooMappingBoardData;
  upsertCustomerMappingAction: (formData: FormData) => Promise<void>;
};

export function OdooMappingBoard({
  initialData,
  upsertCustomerMappingAction,
}: OdooMappingBoardProps) {
  const {
    organizationId,
    customerMapping,
    invoiceMappings,
    subscriptionMappings,
    consultingMappings,
    dataOrigin,
    fallbackReason,
  } = initialData;
  const canWrite = dataOrigin === "supabase";

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.07)]">
        <p className="text-xs font-medium tracking-[0.22em] text-stone-500 uppercase">
          Phase 9
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
          Mapping Odoo
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-700">
          Une organisation AdminBTP peut etre liee a un contact Odoo, puis etendre
          la synchronisation a la facturation, aux abonnements et aux prestations
          de conseil.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-stone-600">
          <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1">
            Source : {dataOrigin}
          </span>
          {fallbackReason ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-900">
              {fallbackReason}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
            Liaison client
          </p>
          <div className="mt-4 rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5 text-sm text-stone-700">
            <p>Organisation : {organizationId}</p>
            <p>Modele Odoo : {customerMapping?.odooModel ?? "Aucun mapping client"}</p>
            <p>Contact lie : {customerMapping?.odooRecordId ?? "Aucune liaison active"}</p>
            <p>Statut : {customerMapping?.syncStatus ?? "non_lie"}</p>
          </div>
          <form action={upsertCustomerMappingAction} className="mt-4 space-y-4">
            <input type="hidden" name="organizationId" value={organizationId} />
            <label className="space-y-2 text-sm text-stone-700">
              <span>Modele Odoo</span>
              <input
                name="odooModel"
                defaultValue={customerMapping?.odooModel ?? "res.partner"}
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                disabled={!canWrite}
              />
            </label>
            <label className="space-y-2 text-sm text-stone-700">
              <span>Identifiant contact Odoo</span>
              <input
                name="odooRecordId"
                defaultValue={customerMapping?.odooRecordId ?? ""}
                placeholder="odoo_partner_1042"
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                disabled={!canWrite}
              />
            </label>
            <label className="space-y-2 text-sm text-stone-700">
              <span>Statut de synchro</span>
              <input
                name="syncStatus"
                defaultValue={customerMapping?.syncStatus ?? "linked"}
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                disabled={!canWrite}
              />
            </label>
            <button
              type="submit"
              disabled={!canWrite}
              className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {customerMapping ? "Mettre a jour la liaison client" : "Creer la liaison client"}
            </button>
            {!canWrite ? (
              <p className="text-sm text-stone-500">
                Le formulaire reste visible pour cadrer le parcours, mais l&apos;ecriture reelle exige un scope Supabase resolu.
              </p>
            ) : null}
          </form>
        </article>

        <article className="space-y-5">
          <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
              Facturation
            </p>
            <pre className="mt-4 whitespace-pre-wrap rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
{JSON.stringify(invoiceMappings, null, 2)}
            </pre>
          </div>

          <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
              Abonnements et conseil
            </p>
            <pre className="mt-4 whitespace-pre-wrap rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
{JSON.stringify(
  {
    subscriptions: subscriptionMappings,
    consulting: consultingMappings,
  },
  null,
  2,
)}
            </pre>
          </div>
        </article>
      </div>
    </section>
  );
}
