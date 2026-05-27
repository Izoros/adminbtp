import type { Organization } from "@/modules/organizations/types/organization";
import type {
  ProjectFormFeedback,
  ProjectRole,
  ProjectStatus,
} from "@/modules/projects/types/project";

export type ProjectDraftInput = {
  ownerOrganizationId: string;
  code: string;
  slug: string;
  name: string;
  description: string;
  status: ProjectStatus;
  role: ProjectRole;
  startsOn?: string;
  endsOn?: string;
};

function normalizeText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export function slugifyProjectName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function isProjectStatus(value: string): value is ProjectStatus {
  return ["draft", "active", "on_hold", "completed", "cancelled"].includes(value);
}

function isProjectRole(value: string): value is ProjectRole {
  return [
    "moa",
    "moe",
    "tce",
    "bet",
    "opc",
    "amo",
    "trade_contractor",
    "subcontractor",
  ].includes(value);
}

export function parseProjectDraft(formData: FormData): ProjectDraftInput {
  const ownerOrganizationId = normalizeText(formData.get("ownerOrganizationId"));
  const name = normalizeText(formData.get("name"));
  const code = normalizeText(formData.get("code")).toUpperCase();
  const providedSlug = normalizeText(formData.get("slug"));
  const description = normalizeText(formData.get("description"));
  const statusValue = normalizeText(formData.get("status"));
  const roleValue = normalizeText(formData.get("role"));
  const startsOn = normalizeText(formData.get("startsOn"));
  const endsOn = normalizeText(formData.get("endsOn"));
  const slug = slugifyProjectName(providedSlug || name);

  if (!ownerOrganizationId) {
    throw new Error("L'organisation proprietaire est obligatoire.");
  }

  if (!name) {
    throw new Error("Le nom du chantier est obligatoire.");
  }

  if (!code) {
    throw new Error("Le code chantier est obligatoire.");
  }

  if (!slug) {
    throw new Error("Le slug du chantier est obligatoire.");
  }

  if (!isProjectStatus(statusValue)) {
    throw new Error("Le statut chantier est invalide.");
  }

  if (!isProjectRole(roleValue)) {
    throw new Error("Le role chantier est invalide.");
  }

  if (startsOn && endsOn && endsOn < startsOn) {
    throw new Error("La date de fin doit etre posterieure a la date de debut.");
  }

  return {
    ownerOrganizationId,
    code,
    slug,
    name,
    description,
    status: statusValue,
    role: roleValue,
    startsOn: startsOn || undefined,
    endsOn: endsOn || undefined,
  };
}

export function getProjectOwnerOptions(
  organizations: Organization[],
  manageableOrganizationIds: string[],
) {
  const idSet = new Set(manageableOrganizationIds);

  return organizations.filter((organization) => idSet.has(organization.id));
}

export function getProjectFeedbackFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): ProjectFormFeedback | null {
  const projectStatus = searchParams.projectStatus;
  const projectError = searchParams.projectError;

  if (typeof projectStatus === "string") {
    if (projectStatus === "created") {
      return {
        tone: "success",
        message: "Le chantier a ete cree dans Supabase avec son premier role projet.",
      };
    }

    if (projectStatus === "demo") {
      return {
        tone: "info",
        message: "Supabase est indisponible. La creation reelle de chantier est bloquee en mode production.",
      };
    }
  }

  if (typeof projectError === "string") {
    return {
      tone: "error",
      message: decodeURIComponent(projectError),
    };
  }

  return null;
}
