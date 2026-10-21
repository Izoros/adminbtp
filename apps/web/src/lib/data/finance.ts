import { createClient } from "@/lib/supabase/server";
import type { Situation } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type SituationRow = Database["public"]["Tables"]["situations"]["Row"];

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
  };
}

export async function getSituations(): Promise<Situation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("situations").select("*").order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map(mapSituation);
}
