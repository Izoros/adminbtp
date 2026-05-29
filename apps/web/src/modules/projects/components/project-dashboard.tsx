import type { AppUserProfile } from "@/modules/auth/types/auth";
import type { Organization, OrganizationMembership } from "@/modules/organizations/types/organization";
import {
  getPrimaryProjectRoleView,
  getProjectsForUser,
} from "@/modules/projects/services/project-access";
import { getProjectOwnerOptions } from "@/modules/projects/services/project-write";
import type { Project, ProjectOrganization } from "@/modules/projects/types/project";
import type { ProjectFormFeedback, ProjectRole } from "@/modules/projects/types/project";

type ProjectDashboardProps = {
  user: AppUserProfile;
  organizations: Organization[];
  memberships: OrganizationMembership[];
  projects: Project[];
  projectOrganizations: ProjectOrganization[];
  source: "supabase";
  sourceDetail: string;
  feedback: ProjectFormFeedback | null;
  createProjectAction: (formData: FormData) => Promise<void>;
};

const availableProjectRoles: Array<{ value: ProjectRole; label: string }> = [
  { value: "moa", label: "MOA" },
  { value: "moe", label: "MOE" },
  { value: "tce", label: "TCE" },
  { value: "bet", label: "BET" },
  { value: "opc", label: "OPC" },
  { value: "amo", label: "AMO" },
  { value: "trade_contractor", label: "Entreprise de lot" },
  { value: "subcontractor", label: "Sous-traitant" },
];

export function ProjectDashboard({
  user,
  organizations,
  memberships,
  projects,
  projectOrganizations,
  sourceDetail,
  feedback,
  createProjectAction,
}: ProjectDashboardProps) {
  const visibleProjects = getProjectsForUser(
    user.id,
    memberships,
    projects,
    projectOrganizations,
  );
  const manageableOrganizations = getProjectOwnerOptions(
    organizations,
    memberships
      .filter((membership) =>
        membership.userId === user.id &&
        (membership.role === "org_owner" || membership.role === "org_admin"),
      )
      .map((membership) => membership.organizationId),
    user.internalRole,
  );
  const isSupabaseWritable = manageableOrganizations.length > 0;

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.07)]">
        <p className="text-xs font-medium tracking-[0.22em] text-stone-500 uppercase">
          Chantiers
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
          Dashboard chantier selon le role
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-700">
          Une meme organisation peut tenir un role different selon le chantier.
          Ici, la vue affiche la priorite correspondant au role projet rattache.
        </p>
        <div className="mt-4 inline-flex rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
          Source : Supabase · {sourceDetail}
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-[0.22em] text-stone-500 uppercase">
              Creation chantier
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
              Initialiser un chantier reel
            </h2>
            <p className="mt-3 text-sm leading-7 text-stone-700">
              Quand une organisation gerable est disponible, le formulaire cree le chantier
              dans Supabase puis rattache immediatement le premier role projet de l&apos;organisation proprietaire.
            </p>
          </div>
          <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
            {isSupabaseWritable ? "Ecriture Supabase active" : "Ecriture indisponible"}
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

        <form action={createProjectAction} className="mt-6 grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-stone-700">
            <span className="font-medium text-stone-900">Organisation proprietaire</span>
            <select
              name="ownerOrganizationId"
              disabled={!isSupabaseWritable || manageableOrganizations.length === 0}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 disabled:cursor-not-allowed disabled:bg-stone-100"
              defaultValue={manageableOrganizations[0]?.id ?? ""}
            >
              {manageableOrganizations.length === 0 ? (
                <option value="">Aucune organisation gerable</option>
              ) : null}
              {manageableOrganizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-stone-700">
            <span className="font-medium text-stone-900">Role principal</span>
            <select
              name="role"
              disabled={!isSupabaseWritable}
              defaultValue="opc"
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 disabled:cursor-not-allowed disabled:bg-stone-100"
            >
              {availableProjectRoles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-stone-700">
            <span className="font-medium text-stone-900">Nom chantier</span>
            <input
              name="name"
              type="text"
              placeholder="Construction groupe scolaire Mamoudzou"
              disabled={!isSupabaseWritable}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 disabled:cursor-not-allowed disabled:bg-stone-100"
            />
          </label>

          <label className="space-y-2 text-sm text-stone-700">
            <span className="font-medium text-stone-900">Code chantier</span>
            <input
              name="code"
              type="text"
              placeholder="ABTP-MAM-001"
              disabled={!isSupabaseWritable}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 disabled:cursor-not-allowed disabled:bg-stone-100"
            />
          </label>

          <label className="space-y-2 text-sm text-stone-700">
            <span className="font-medium text-stone-900">Slug</span>
            <input
              name="slug"
              type="text"
              placeholder="construction-groupe-scolaire-mamoudzou"
              disabled={!isSupabaseWritable}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 disabled:cursor-not-allowed disabled:bg-stone-100"
            />
          </label>

          <label className="space-y-2 text-sm text-stone-700">
            <span className="font-medium text-stone-900">Statut initial</span>
            <select
              name="status"
              disabled={!isSupabaseWritable}
              defaultValue="draft"
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 disabled:cursor-not-allowed disabled:bg-stone-100"
            >
              <option value="draft">Brouillon</option>
              <option value="active">Actif</option>
              <option value="on_hold">En attente</option>
            </select>
          </label>

          <label className="space-y-2 text-sm text-stone-700 lg:col-span-2">
            <span className="font-medium text-stone-900">Description</span>
            <textarea
              name="description"
              rows={4}
              placeholder="Contexte, objectif et cadrage initial du chantier."
              disabled={!isSupabaseWritable}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 disabled:cursor-not-allowed disabled:bg-stone-100"
            />
          </label>

          <label className="space-y-2 text-sm text-stone-700">
            <span className="font-medium text-stone-900">Debut previsionnel</span>
            <input
              name="startsOn"
              type="date"
              disabled={!isSupabaseWritable}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 disabled:cursor-not-allowed disabled:bg-stone-100"
            />
          </label>

          <label className="space-y-2 text-sm text-stone-700">
            <span className="font-medium text-stone-900">Fin previsionnelle</span>
            <input
              name="endsOn"
              type="date"
              disabled={!isSupabaseWritable}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 disabled:cursor-not-allowed disabled:bg-stone-100"
            />
          </label>

          <div className="lg:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-6 text-stone-500">
              {manageableOrganizations.length > 0
                ? "Le chantier sera rattache a la premiere organisation choisie avec le role principal selectionne."
                : "Aucune organisation proprietaire n'est encore disponible. Creez d'abord une organisation dans l'onglet Organisations."}
            </p>
            <button
              type="submit"
              disabled={!isSupabaseWritable || manageableOrganizations.length === 0}
              className="inline-flex items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              Creer le chantier
            </button>
          </div>
        </form>
      </div>

      {visibleProjects.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white/70 p-8 text-sm text-stone-600">
          Aucun chantier exploitable n&apos;a ete trouve pour cette session.
        </div>
      ) : null}

      <div className="grid gap-6">
        {visibleProjects.map((project) => {
          const roleView = getPrimaryProjectRoleView(
            user.id,
            project.id,
            memberships,
            projectOrganizations,
          );

          const ownerOrganization = organizations.find(
            (organization) => organization.id === project.ownerOrganizationId,
          );

          return (
            <article
              key={project.id}
              className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]"
            >
              <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
                    {project.code}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
                    {project.name}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-700">
                    {project.description}
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
                  <p>
                    Proprietaire :{" "}
                    <span className="font-medium text-stone-950">
                      {ownerOrganization?.name ?? "Organisation inconnue"}
                    </span>
                  </p>
                  <p className="mt-1">Statut : {project.status}</p>
                </div>
              </div>

              {roleView ? (
                <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                  <div className="rounded-[1.5rem] border border-amber-200/70 bg-[linear-gradient(135deg,#fffaf4_0%,#f8efe0_100%)] p-5">
                    <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
                      {roleView.title}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-stone-700">
                      {roleView.summary}
                    </p>

                    <ul className="mt-5 space-y-3">
                      {roleView.priorities.map((priority) => (
                        <li
                          key={priority}
                          className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-stone-700"
                        >
                          {priority}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5">
                    <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
                      Indicateurs a afficher
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                      {roleView.indicators.map((indicator) => (
                        <div
                          key={indicator}
                          className="rounded-2xl border border-stone-200 bg-white px-4 py-4"
                        >
                          <p className="text-sm font-medium text-stone-900">{indicator}</p>
                          <p className="mt-2 text-xs text-stone-500">
                            Placeholder de phase 2 en attente des donnees chantier reelles.
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
