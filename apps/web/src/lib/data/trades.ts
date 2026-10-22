import { createClient } from "@/lib/supabase/server";
import type { TradeCode } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type TradeCodeRow = Database["public"]["Tables"]["trade_codes"]["Row"];

function mapTradeCode(row: TradeCodeRow): TradeCode {
  return { id: row.id, code: row.code, label: row.label, family: row.family };
}

export async function getTradeCodes(): Promise<TradeCode[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("trade_codes").select("*").order("label");
  if (error) throw error;
  return (data ?? []).map(mapTradeCode);
}
