import { createClient } from "@/lib/supabase/server";
import type { OrganizationDomain } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type OrganizationDomainRow = Database["public"]["Tables"]["organization_domains"]["Row"];

function mapDomain(row: OrganizationDomainRow): OrganizationDomain {
  return {
    id: row.id,
    organizationId: row.organization_id,
    domain: row.domain,
    isVerified: row.is_verified,
    createdAt: row.created_at,
  };
}

/** Domaines mail d'une organisation — une organisation peut en déclarer plusieurs (ex: filiales,
 * marques commerciales distinctes), voir database/migrations/0005_multitenant_saas_requirements.sql. */
export async function getOrganizationDomains(organizationId: string): Promise<OrganizationDomain[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_domains")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map(mapDomain);
}
