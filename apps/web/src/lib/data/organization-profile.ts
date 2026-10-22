import { createClient } from "@/lib/supabase/server";
import type { OrganizationProfile, OrganizationTrade } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type OrganizationProfileRow = Database["public"]["Tables"]["organization_profiles"]["Row"];
type OrganizationTradeRow = Database["public"]["Tables"]["organization_trades"]["Row"];

function mapOrganizationProfile(row: OrganizationProfileRow): OrganizationProfile {
  return {
    id: row.id,
    organizationId: row.organization_id,
    legalKind: row.legal_kind,
    defaultMissionRoles: row.default_mission_roles ?? [],
    sizeBand: row.size_band ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrganizationTrade(row: OrganizationTradeRow): OrganizationTrade {
  return {
    id: row.id,
    organizationId: row.organization_id,
    tradeCodeId: row.trade_code_id,
    isPrimary: row.is_primary,
  };
}

export async function getOrganizationProfile(organizationId: string): Promise<OrganizationProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_profiles")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapOrganizationProfile(data) : null;
}

export async function getOrganizationTrades(organizationId: string): Promise<OrganizationTrade[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_trades")
    .select("*")
    .eq("organization_id", organizationId);
  if (error) throw error;
  return (data ?? []).map(mapOrganizationTrade);
}
