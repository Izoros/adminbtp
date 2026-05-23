import { demoOdooMappings } from "@/modules/settings/services/demo-odoo";
import {
  findCustomerMappingForOrganization,
  getMappingsByType,
} from "@/modules/settings/services/odoo-mapping";

export function OdooMappingBoard() {
  const customerMapping = findCustomerMappingForOrganization(
    demoOdooMappings,
    "org_adminbtp_001",
  );
  const invoiceMappings = getMappingsByType(demoOdooMappings, "invoice");
  const subscriptionMappings = getMappingsByType(demoOdooMappings, "subscription");
  const consultingMappings = getMappingsByType(
    demoOdooMappings,
    "consulting_service",
  );

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
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
            Liaison client
          </p>
          <div className="mt-4 rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5 text-sm text-stone-700">
            <p>Organisation : {customerMapping?.organizationId}</p>
            <p>Modele Odoo : {customerMapping?.odooModel}</p>
            <p>Contact lie : {customerMapping?.odooRecordId}</p>
            <p>Statut : {customerMapping?.syncStatus}</p>
          </div>
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
