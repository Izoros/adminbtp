import { createClient } from "@/lib/supabase/server";
import type { PortfolioGrant } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type PortfolioGrantRow = Database["public"]["Tables"]["portfolio_grants"]["Row"];

function mapGrant(row: PortfolioGrantRow): PortfolioGrant {
  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id,
    grantedBy: row.granted_by,
    grantedAt: row.granted_at,
    revokedAt: row.revoked_at ?? undefined,
    revokedBy: row.revoked_by ?? undefined,
  };
}

/**
 * Tous les grants de portefeuille (actifs et révoqués), toutes organisations confondues —
 * traçabilité complète (qui a attribué/révoqué, quand). Un grant révoqué n'est jamais supprimé,
 * voir has_portfolio_access() dans database/migrations/0001_init_core_schema.sql.
 */
export async function getAllPortfolioGrants(): Promise<PortfolioGrant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portfolio_grants")
    .select("*")
    .order("granted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapGrant);
}
