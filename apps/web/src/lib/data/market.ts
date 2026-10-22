import { createClient } from "@/lib/supabase/server";
import type { MarketContract, MarketClause, PriceLine } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type MarketContractRow = Database["public"]["Tables"]["market_contracts"]["Row"];
type MarketClauseRow = Database["public"]["Tables"]["market_clauses"]["Row"];
type PriceLineRow = Database["public"]["Tables"]["price_lines"]["Row"];

function mapMarketContract(row: MarketContractRow): MarketContract {
  return {
    id: row.id,
    siteId: row.site_id,
    lotId: row.lot_id ?? undefined,
    contractType: row.contract_type,
    priceReferenceMonth: row.price_reference_month ?? undefined,
    retentionGuaranteeRate: row.retention_guarantee_rate ?? undefined,
    paymentTermDays: row.payment_term_days ?? undefined,
    retentionBasisAmountHt: row.retention_basis_amount_ht ?? undefined,
    retentionReleaseDueOn: row.retention_release_due_on ?? undefined,
    retentionSubstitutedByCaution: row.retention_substituted_by_caution,
    cautionDocumentId: row.caution_document_id ?? undefined,
    advanceAmountHt: row.advance_amount_ht ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMarketClause(row: MarketClauseRow): MarketClause {
  return {
    id: row.id,
    contractId: row.contract_id,
    kind: row.kind,
    payload: (row.payload as Record<string, unknown>) ?? {},
    status: row.status,
    sourceDocumentId: row.source_document_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPriceLine(row: PriceLineRow): PriceLine {
  return {
    id: row.id,
    lotId: row.lot_id,
    code: row.code,
    label: row.label,
    unit: row.unit,
    quantityMarket: row.quantity_market,
    unitPriceHt: row.unit_price_ht,
    origin: row.origin,
    status: row.status,
    amendmentId: row.amendment_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getMarketContractsBySite(siteId: string): Promise<MarketContract[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("market_contracts").select("*").eq("site_id", siteId);
  if (error) throw error;
  return (data ?? []).map(mapMarketContract);
}

export async function getMarketClauses(contractIds: string[]): Promise<MarketClause[]> {
  if (contractIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("market_clauses").select("*").in("contract_id", contractIds);
  if (error) throw error;
  return (data ?? []).map(mapMarketClause);
}

export async function getPriceLines(lotIds: string[]): Promise<PriceLine[]> {
  if (lotIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("price_lines").select("*").in("lot_id", lotIds);
  if (error) throw error;
  return (data ?? []).map(mapPriceLine);
}
