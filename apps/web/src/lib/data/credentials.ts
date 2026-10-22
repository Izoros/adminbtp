import { createClient } from "@/lib/supabase/server";
import type { OrganizationCredential } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type OrganizationCredentialRow = Database["public"]["Tables"]["organization_credentials"]["Row"];

function mapCredential(row: OrganizationCredentialRow): OrganizationCredential {
  return {
    id: row.id,
    organizationId: row.organization_id,
    kind: row.kind,
    expiresOn: row.expires_on ?? undefined,
    documentId: row.document_id ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getOrganizationCredentials(organizationId: string): Promise<OrganizationCredential[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_credentials")
    .select("*")
    .eq("organization_id", organizationId)
    .order("kind");
  if (error) throw error;
  return (data ?? []).map(mapCredential);
}

export async function getOrganizationCredentialsFor(organizationIds: string[]): Promise<OrganizationCredential[]> {
  if (organizationIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_credentials")
    .select("*")
    .in("organization_id", organizationIds);
  if (error) throw error;
  return (data ?? []).map(mapCredential);
}
