import { createClient } from "@/lib/supabase/server";
import type { Situation, SituationLine, SituationAllocation } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type SituationRow = Database["public"]["Tables"]["situations"]["Row"];
type SituationLineRow = Database["public"]["Tables"]["situation_lines"]["Row"];
type SituationAllocationRow = Database["public"]["Tables"]["situation_allocations"]["Row"];

function mapSituation(row: SituationRow): Situation {
  return {
    id: row.id,
    siteId: row.site_id,
    lotId: row.lot_id ?? undefined,
    number: row.number,
    amountHt: row.amount_ht,
    status: row.status,
    submittedAt: row.submitted_at ?? undefined,
    dueDate: row.due_date ?? undefined,
    paidAt: row.paid_at ?? undefined,
    disputeReason: row.dispute_reason ?? undefined,
    actualizationCoefficient: row.actualization_coefficient ?? undefined,
    indexMonth: row.index_month ?? undefined,
    retentionAmount: row.retention_amount ?? undefined,
    advanceRecovered: row.advance_recovered ?? undefined,
    penaltiesAmount: row.penalties_amount ?? undefined,
    netAmountHt: row.net_amount_ht ?? undefined,
  };
}

function mapSituationLine(row: SituationLineRow): SituationLine {
  return {
    id: row.id,
    situationId: row.situation_id,
    priceLineId: row.price_line_id,
    quantityPrevious: row.quantity_previous,
    quantityMonth: row.quantity_month,
    unitPriceHt: row.unit_price_ht,
    amountHt: row.amount_ht,
  };
}

function mapSituationAllocation(row: SituationAllocationRow): SituationAllocation {
  return {
    id: row.id,
    situationId: row.situation_id,
    payeeOrganizationId: row.payee_organization_id,
    amountHt: row.amount_ht,
    createdAt: row.created_at,
  };
}

export async function getSituations(): Promise<Situation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("situations").select("*").order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map(mapSituation);
}

export async function getSituationsBySite(siteId: string): Promise<Situation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("situations")
    .select("*")
    .eq("site_id", siteId)
    .order("number", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapSituation);
}

export async function getSituationLines(situationIds: string[]): Promise<SituationLine[]> {
  if (situationIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("situation_lines").select("*").in("situation_id", situationIds);
  if (error) throw error;
  return (data ?? []).map(mapSituationLine);
}

export async function getSituationAllocations(situationIds: string[]): Promise<SituationAllocation[]> {
  if (situationIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("situation_allocations").select("*").in("situation_id", situationIds);
  if (error) throw error;
  return (data ?? []).map(mapSituationAllocation);
}
