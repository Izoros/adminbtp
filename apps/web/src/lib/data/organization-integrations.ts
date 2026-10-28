import { createClient } from "@/lib/supabase/server";
import type { OrganizationIntegration } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type OrganizationIntegrationRow = Database["public"]["Tables"]["organization_integrations"]["Row"];

function mapIntegration(row: OrganizationIntegrationRow): OrganizationIntegration {
  return {
    id: row.id,
    organizationId: row.organization_id,
    integrationType: row.integration_type,
    managedBy: row.managed_by,
    config: (row.config ?? {}) as Record<string, unknown>,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Connecteurs externes (Odoo, n8n...) configurés pour une organisation — une ligne par type au
 * plus (contrainte unique organization_id/integration_type), jamais de secret en clair ici. */
export async function getOrganizationIntegrations(organizationId: string): Promise<OrganizationIntegration[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_integrations")
    .select("*")
    .eq("organization_id", organizationId);
  if (error) throw error;
  return (data ?? []).map(mapIntegration);
}
