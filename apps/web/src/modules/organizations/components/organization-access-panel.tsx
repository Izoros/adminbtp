import type { AppUserProfile } from "@/modules/auth/types/auth";
import { getOrganizationsForUser, isOrganizationManager } from "@/modules/organizations/services/access-control";
import { getManageableOrganizations } from "@/modules/organizations/services/organization-write";
import type {
  Organization,
  OrganizationFormFeedback,
  OrganizationMembership,
} from "@/modules/organizations/types/organization";

type OrganizationAccessPanelProps = {
  user: AppUserProfile;
  organizations: Organization[];
  memberships: OrganizationMembership[];
  source: "supabase" | "demo";
  sourceDetail: string;
  feedback: OrganizationFormFeedback | null;
  createOrganizationAction: (formData: FormData) => Promise<void>;
};

export function OrganizationAccessPanel({
  user,
  organizations,
  memberships,
  source,
  sourceDetail,
  feedback,
  createOrganizationAction,
}: OrganizationAccessPanelProps) {
  const visibleOrganizations = getOrganizationsForUser(
    user.id,
    organizations,
    memberships,
  );
  const manageableOrganizations = getManageableOrganizations(
    visibleOrganizations,
    memberships
      .filter((membership) =>
        membership.userId === user.id &&
        (membership.role === "org_owner" || membership.role === "org_admin"),
      )
      .map((membership) => membership.organizationId),
  );
  const isSupabaseWritable = source === "supabase";

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.07)]">
        <p className="text-xs font-medium tracking-[0.22em] text-stone-500 uppercase">
          Session locale
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
          {user.fullName}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-700">
          Cette vue applique la logique multi-tenant: la session courante ne voit
          que les organisations auxquelles elle appartient.
        </p>
        <div className="mt-4 inline-flex rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
          Source : {source === "supabase" ? "Supabase" : "Demonstration"} · {sourceDetail}
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-[0.22em] text-stone-500 uppercase">
              Creation organisation
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
              Ouvrir une nouvelle structure
            </h2>
            <p className="mt-3 text-sm leading-7 text-stone-700">
              Quand Supabase est disponible, ce formulaire cree l&apos;organisation,
              cree aussi votre rattachement owner et la rend visible immediatement
              dans l&apos;espace multi-tenant.
            </p>
          </div>
          <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
            {isSupabaseWritable ? "Ecriture Supabase active" : "Mode demonstration"}
          </span>
        </div>

        {feedback ? (
          <div
            className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
              feedback.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : feedback.tone === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : "border-stone-200 bg-stone-50 text-stone-700"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <form action={createOrganizationAction} className="mt-6 grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-stone-700">
            <span className="font-medium text-stone-900">Nom visible</span>
            <input
              name="name"
              type="text"
              placeholder="Atelier BTP Conseil"
              disabled={!isSupabaseWritable}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 disabled:cursor-not-allowed disabled:bg-stone-100"
            />
          </label>

          <label className="space-y-2 text-sm text-stone-700">
            <span className="font-medium text-stone-900">Slug</span>
            <input
              name="slug"
              type="text"
              placeholder="atelier-btp-conseil"
              disabled={!isSupabaseWritable}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 disabled:cursor-not-allowed disabled:bg-stone-100"
            />
          </label>

          <label className="space-y-2 text-sm text-stone-700 lg:col-span-2">
            <span className="font-medium text-stone-900">Raison sociale</span>
            <input
              name="legalName"
              type="text"
              placeholder="Atelier BTP Conseil SAS"
              disabled={!isSupabaseWritable}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 disabled:cursor-not-allowed disabled:bg-stone-100"
            />
          </label>

          <div className="lg:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-6 text-stone-500">
              {isSupabaseWritable
                ? manageableOrganizations.length > 0
                  ? "Vous pourrez gerer cette organisation des sa creation."
                  : "Aucun rattachement manager existant n'est requis pour ce bootstrap owner."
                : "Supabase indisponible: le formulaire reste visible pour cadrer le parcours, mais n'ecrit pas en base."}
            </p>
            <button
              type="submit"
              disabled={!isSupabaseWritable}
              className="inline-flex items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              Creer l&apos;organisation
            </button>
          </div>
        </form>
      </div>

      {visibleOrganizations.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white/70 p-8 text-sm text-stone-600">
          Aucune organisation exploitable n&apos;a ete trouvee pour cette session.
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {visibleOrganizations.map((organization) => {
          const isManager = isOrganizationManager(user.id, organization.id, memberships);

          return (
            <article
              key={organization.id}
              className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
                    {organization.slug}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
                    {organization.name}
                  </h2>
                  <p className="mt-2 text-sm text-stone-600">
                    {organization.legalName ?? "Raison sociale a completer"}
                  </p>
                </div>
                <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
                  {isManager ? "Gestion" : "Lecture"}
                </span>
              </div>

              <div className="mt-4 text-xs text-stone-500">
                Mode d&apos;acces: {isManager ? "administration multi-tenant" : "consultation restreinte"}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
