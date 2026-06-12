import type { OdooMappingBoardData } from "@/modules/settings/types/odoo";

type OdooMappingBoardProps = {
  initialData: OdooMappingBoardData;
  upsertMappingAction: (formData: FormData) => Promise<void>;
};

export function OdooMappingBoard({
  initialData,
  upsertMappingAction,
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
          Odoo
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
          <form action={upsertMappingAction} className="mt-4 space-y-4">
            <input type="hidden" name="organizationId" value={organizationId} />
            <input type="hidden" name="bindingType" value="customer" />
            <input type="hidden" name="adminbtpEntityId" value={customerMapping?.adminbtpEntityId ?? organizationId} />
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
            <form action={upsertMappingAction} className="mt-4 space-y-4">
              <input type="hidden" name="organizationId" value={organizationId} />
              <input type="hidden" name="bindingType" value="invoice" />
              <label className="space-y-2 text-sm text-stone-700">
                <span>Entite AdminBTP facture</span>
                <input
                  name="adminbtpEntityId"
                  defaultValue={invoiceMappings[0]?.adminbtpEntityId ?? "invoice_adminbtp_001"}
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                  disabled={!canWrite}
                />
              </label>
              <label className="space-y-2 text-sm text-stone-700">
                <span>Modele Odoo</span>
                <input
                  name="odooModel"
                  defaultValue={invoiceMappings[0]?.odooModel ?? "account.move"}
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                  disabled={!canWrite}
                />
              </label>
              <label className="space-y-2 text-sm text-stone-700">
                <span>Identifiant facture Odoo</span>
                <input
                  name="odooRecordId"
                  defaultValue={invoiceMappings[0]?.odooRecordId ?? ""}
                  placeholder="odoo_invoice_8891"
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                  disabled={!canWrite}
                />
              </label>
              <label className="space-y-2 text-sm text-stone-700">
                <span>Statut de synchro</span>
                <input
                  name="syncStatus"
                  defaultValue={invoiceMappings[0]?.syncStatus ?? "linked"}
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                  disabled={!canWrite}
                />
              </label>
              <button
                type="submit"
                disabled={!canWrite}
                className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {invoiceMappings[0] ? "Mettre a jour le mapping facture" : "Creer le mapping facture"}
              </button>
            </form>
          </div>

          <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
              Abonnements et conseil
            </p>
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <form action={upsertMappingAction} className="space-y-4 rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-4">
                <input type="hidden" name="organizationId" value={organizationId} />
                <input type="hidden" name="bindingType" value="subscription" />
                <label className="space-y-2 text-sm text-stone-700">
                  <span>Entite AdminBTP abonnement</span>
                  <input
                    name="adminbtpEntityId"
                    defaultValue={subscriptionMappings[0]?.adminbtpEntityId ?? "subscription_adminbtp_001"}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                    disabled={!canWrite}
                  />
                </label>
                <label className="space-y-2 text-sm text-stone-700">
                  <span>Modele Odoo</span>
                  <input
                    name="odooModel"
                    defaultValue={subscriptionMappings[0]?.odooModel ?? "sale.subscription"}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                    disabled={!canWrite}
                  />
                </label>
                <label className="space-y-2 text-sm text-stone-700">
                  <span>Identifiant abonnement Odoo</span>
                  <input
                    name="odooRecordId"
                    defaultValue={subscriptionMappings[0]?.odooRecordId ?? ""}
                    placeholder="odoo_subscription_2001"
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                    disabled={!canWrite}
                  />
                </label>
                <label className="space-y-2 text-sm text-stone-700">
                  <span>Statut de synchro</span>
                  <input
                    name="syncStatus"
                    defaultValue={subscriptionMappings[0]?.syncStatus ?? "linked"}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                    disabled={!canWrite}
                  />
                </label>
                <button
                  type="submit"
                  disabled={!canWrite}
                  className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  {subscriptionMappings[0] ? "Mettre a jour l'abonnement" : "Creer l'abonnement"}
                </button>
              </form>

              <form action={upsertMappingAction} className="space-y-4 rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-4">
                <input type="hidden" name="organizationId" value={organizationId} />
                <input type="hidden" name="bindingType" value="consulting_service" />
                <label className="space-y-2 text-sm text-stone-700">
                  <span>Entite AdminBTP conseil</span>
                  <input
                    name="adminbtpEntityId"
                    defaultValue={consultingMappings[0]?.adminbtpEntityId ?? "consulting_adminbtp_001"}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                    disabled={!canWrite}
                  />
                </label>
                <label className="space-y-2 text-sm text-stone-700">
                  <span>Modele Odoo</span>
                  <input
                    name="odooModel"
                    defaultValue={consultingMappings[0]?.odooModel ?? "product.product"}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                    disabled={!canWrite}
                  />
                </label>
                <label className="space-y-2 text-sm text-stone-700">
                  <span>Identifiant prestation Odoo</span>
                  <input
                    name="odooRecordId"
                    defaultValue={consultingMappings[0]?.odooRecordId ?? ""}
                    placeholder="odoo_service_301"
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                    disabled={!canWrite}
                  />
                </label>
                <label className="space-y-2 text-sm text-stone-700">
                  <span>Statut de synchro</span>
                  <input
                    name="syncStatus"
                    defaultValue={consultingMappings[0]?.syncStatus ?? "linked"}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                    disabled={!canWrite}
                  />
                </label>
                <button
                  type="submit"
                  disabled={!canWrite}
                  className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  {consultingMappings[0] ? "Mettre a jour le conseil" : "Creer le conseil"}
                </button>
              </form>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
