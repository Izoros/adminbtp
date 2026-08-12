import {
  odooSocialBindingDefinitions,
  type OdooBindingDefinition,
} from "@/modules/settings/services/odoo-social-catalog";
import type {
  OdooMapping,
  OdooMappingBoardData,
} from "@/modules/settings/types/odoo";

type OdooMappingBoardProps = {
  initialData: OdooMappingBoardData;
  upsertMappingAction: (formData: FormData) => Promise<void>;
  feedback?: { status: "success" | "error"; message: string };
};

function OdooMappingForm({
  action,
  canWrite,
  definition,
  mapping,
  organizationId,
}: {
  action: (formData: FormData) => Promise<void>;
  canWrite: boolean;
  definition: OdooBindingDefinition;
  mapping?: OdooMapping;
  organizationId: string;
}) {
  return (
    <form
      action={action}
      className="space-y-4 rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-4"
    >
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="bindingType" value={definition.bindingType} />
      <div>
        <h3 className="font-semibold text-stone-950">{definition.title}</h3>
        <p className="mt-1 text-sm leading-6 text-stone-600">{definition.description}</p>
      </div>
      <label className="space-y-2 text-sm text-stone-700">
        <span>{definition.entityLabel}</span>
        <input
          name="adminbtpEntityId"
          defaultValue={mapping?.adminbtpEntityId ?? definition.entityPlaceholder}
          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
          disabled={!canWrite}
          required
        />
      </label>
      <label className="space-y-2 text-sm text-stone-700">
        <span>Modele Odoo</span>
        <input
          name="odooModel"
          defaultValue={mapping?.odooModel ?? definition.odooModel}
          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 font-mono text-xs outline-none transition focus:border-stone-400"
          disabled={!canWrite}
          required
        />
      </label>
      <label className="space-y-2 text-sm text-stone-700">
        <span>{definition.recordLabel}</span>
        <input
          name="odooRecordId"
          defaultValue={mapping?.odooRecordId ?? ""}
          placeholder={definition.recordPlaceholder}
          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
          disabled={!canWrite}
          required
        />
      </label>
      <label className="space-y-2 text-sm text-stone-700">
        <span>Statut de synchronisation</span>
        <select
          name="syncStatus"
          defaultValue={mapping?.syncStatus ?? "linked"}
          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
          disabled={!canWrite}
        >
          <option value="linked">Lie, non teste</option>
          <option value="ready">Pret a synchroniser</option>
          <option value="synced">Synchronise</option>
          <option value="error">Erreur a traiter</option>
        </select>
      </label>
      {definition.sensitivity === "payroll" ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-900">
          Le mapping conserve uniquement les identifiants de liaison. Aucun montant,
          bulletin ou element salarial n&apos;est copie dans AdminBTP.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={!canWrite}
        className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        {mapping ? `Mettre a jour ${definition.title.toLowerCase()}` : `Lier ${definition.title.toLowerCase()}`}
      </button>
    </form>
  );
}

export function OdooMappingBoard({
  feedback,
  initialData,
  upsertMappingAction,
}: OdooMappingBoardProps) {
  const {
    organizationId,
    customerMapping,
    invoiceMappings,
    subscriptionMappings,
    consultingMappings,
    socialMappings,
    connectionReadiness,
    canWrite,
    dataOrigin,
    fallbackReason,
  } = initialData;

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
        {feedback ? (
          <p
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
              feedback.status === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
            role="status"
          >
            {feedback.message}
          </p>
        ) : null}
      </div>

      <section className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
              Connecteur natif Odoo 19
            </p>
            <h2 className="mt-2 text-xl font-semibold text-stone-950">
              API JSON-2 : {connectionReadiness.statusLabel}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-600">
              L&apos;adaptateur serveur utilise une cle API Bearer, une base explicite et
              une liste blanche HTTPS. Les modeles disponibles doivent etre confirmes
              sur la page `/doc` de l&apos;instance Odoo cible avant la premiere synchronisation.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              connectionReadiness.status === "ready"
                ? "bg-emerald-100 text-emerald-800"
                : connectionReadiness.status === "attention"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-stone-200 text-stone-700"
            }`}
          >
            {connectionReadiness.statusLabel}
          </span>
        </div>
        <ul className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {connectionReadiness.checks.map((item) => (
            <li key={item.label} className="rounded-2xl bg-stone-50 px-4 py-3 text-sm">
              <p className="font-medium text-stone-900">{item.label}</p>
              <p className={item.ready ? "mt-1 text-emerald-700" : "mt-1 text-stone-500"}>
                {item.detail}
              </p>
            </li>
          ))}
        </ul>
      </section>

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

      <section className="rounded-[1.75rem] border border-indigo-200/80 bg-indigo-50/40 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
        <div className="max-w-4xl">
          <p className="text-xs font-medium tracking-[0.18em] text-indigo-700 uppercase">
            Gestion sociale et RH
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-stone-950">
            Mappings collaborateurs, contrats, temps, absences et paie
          </h2>
          <p className="mt-3 text-sm leading-7 text-stone-700">
            AdminBTP conserve ici les correspondances d&apos;identifiants. Odoo reste le
            systeme de reference pour les donnees sociales. Aucun bulletin ni montant
            salarial n&apos;est persiste par ces formulaires.
          </p>
        </div>
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {odooSocialBindingDefinitions.map((definition) => (
            <OdooMappingForm
              key={definition.bindingType}
              action={upsertMappingAction}
              canWrite={canWrite}
              definition={definition}
              mapping={socialMappings[definition.bindingType][0]}
              organizationId={organizationId}
            />
          ))}
        </div>
        {!canWrite ? (
          <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Les mappings sont en lecture seule tant qu&apos;une session et une organisation
            autorisee ne sont pas resolues dans Supabase.
          </p>
        ) : null}
      </section>
    </section>
  );
}
