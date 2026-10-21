import { createClient } from "@/lib/supabase/server";
import type { Organization } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type OrgRow = Database["public"]["Tables"]["organizations"]["Row"];

function mapOrganization(row: OrgRow): Organization {
  return {
    id: row.id,
    name: row.name,
    legalName: row.legal_name,
    siret: row.siret ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    address: row.address ?? undefined,
    postalCode: row.postal_code ?? undefined,
    city: row.city ?? undefined,
    country: row.country,
    domain: row.domain ?? undefined,
    domainVerified: row.domain_verified,
    subscriptionPlan: row.subscription_plan,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getOrganizations(): Promise<Organization[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("organizations").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map(mapOrganization);
}

export async function getOrganization(id: string): Promise<Organization | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("organizations").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapOrganization(data) : null;
}
