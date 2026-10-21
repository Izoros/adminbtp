import { cookies } from "next/headers";
import type { Organization } from "@adminbtp/types";

export const ACTIVE_ORG_COOKIE = "adminbtp_active_org";

export async function getActiveOrganizationIdCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null;
}

/**
 * Résout l'organisation active parmi celles accessibles à l'utilisateur (déjà filtrées par RLS,
 * voir can_access_organization()) : respecte le choix du sélecteur s'il est encore valide, sinon
 * retombe sur la première organisation accessible. Ne lève jamais si la liste est vide.
 */
export function resolveActiveOrganization(
  organizations: Organization[],
  cookieOrganizationId: string | null
): Organization | null {
  if (organizations.length === 0) return null;
  const fromCookie = cookieOrganizationId
    ? organizations.find((o) => o.id === cookieOrganizationId)
    : undefined;
  return fromCookie ?? organizations[0]!;
}
