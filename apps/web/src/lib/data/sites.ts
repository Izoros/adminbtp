import { createClient } from "@/lib/supabase/server";
import type { Site, SiteParticipant, Lot } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type SiteRow = Database["public"]["Tables"]["sites"]["Row"];
type SiteParticipantRow = Database["public"]["Tables"]["site_participants"]["Row"];
type LotRow = Database["public"]["Tables"]["lots"]["Row"];

function mapSite(row: SiteRow): Site {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    reference: row.reference,
    address: row.address,
    city: row.city,
    postalCode: row.postal_code ?? undefined,
    status: row.status,
    budgetHt: row.budget_ht ?? undefined,
    startDate: row.start_date ?? undefined,
    endDateEstimated: row.end_date_estimated ?? undefined,
    managerUserId: row.manager_user_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSiteParticipant(row: SiteParticipantRow): SiteParticipant {
  return {
    id: row.id,
    siteId: row.site_id,
    organizationId: row.organization_id,
    missionRole: row.mission_role,
    lotId: row.lot_id ?? undefined,
    contractAmountHt: row.contract_amount_ht ?? undefined,
    joinedAt: row.joined_at,
  };
}

function mapLot(row: LotRow): Lot {
  return {
    id: row.id,
    siteId: row.site_id,
    number: row.number,
    name: row.name,
    assignedOrganizationId: row.assigned_organization_id ?? undefined,
    amountHt: row.amount_ht ?? undefined,
  };
}

export async function getSites(): Promise<Site[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("sites").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapSite);
}

export async function getSite(id: string): Promise<Site | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("sites").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapSite(data) : null;
}

export async function getSiteParticipants(siteId: string): Promise<SiteParticipant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_participants").select("*").eq("site_id", siteId);
  if (error) throw error;
  return (data ?? []).map(mapSiteParticipant);
}

export async function getLots(siteId: string): Promise<Lot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("lots").select("*").eq("site_id", siteId);
  if (error) throw error;
  return (data ?? []).map(mapLot);
}
