import type {
  Organization,
  OrganizationFormFeedback,
} from "@/modules/organizations/types/organization";

export type OrganizationDraftInput = {
  name: string;
  slug: string;
  legalName?: string;
};

function normalizeText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export function slugifyOrganizationName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function parseOrganizationDraft(formData: FormData): OrganizationDraftInput {
  const name = normalizeText(formData.get("name"));
  const providedSlug = normalizeText(formData.get("slug"));
  const legalName = normalizeText(formData.get("legalName"));
  const slug = slugifyOrganizationName(providedSlug || name);

  if (!name) {
    throw new Error("Le nom de l'organisation est obligatoire.");
  }

  if (!slug) {
    throw new Error("Le slug de l'organisation est obligatoire.");
  }

  return {
    name,
    slug,
    legalName: legalName || undefined,
  };
}

export function getManageableOrganizations(
  organizations: Organization[],
  manageableOrganizationIds: string[],
) {
  const idSet = new Set(manageableOrganizationIds);

  return organizations.filter((organization) => idSet.has(organization.id));
}

export function getOrganizationFeedbackFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): OrganizationFormFeedback | null {
  const organizationStatus = searchParams.organizationStatus;
  const organizationError = searchParams.organizationError;

  if (typeof organizationStatus === "string") {
    if (organizationStatus === "created") {
      return {
        tone: "success",
        message: "L'organisation a ete creee dans Supabase puis rattachee a votre session.",
      };
    }

  }

  if (typeof organizationError === "string") {
    return {
      tone: "error",
      message: decodeURIComponent(organizationError),
    };
  }

  return null;
}
