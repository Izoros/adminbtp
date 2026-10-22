import { createClient } from "@/lib/supabase/server";
import type { Amendment } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type AmendmentRow = Database["public"]["Tables"]["amendments"]["Row"];

function mapAmendment(row: AmendmentRow): Amendment {
  return {
    id: row.id,
    siteId: row.site_id,
    lotId: row.lot_id ?? undefined,
    number: row.number,
    reason: row.reason,
    deltaHt: row.delta_ht,
    status: row.status,
    sourceLogEntryId: row.source_log_entry_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    validatedAt: row.validated_at ?? undefined,
    validatedByUserId: row.validated_by_user_id ?? undefined,
  };
}

export async function getAmendmentsBySite(siteId: string): Promise<Amendment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("amendments")
    .select("*")
    .eq("site_id", siteId)
    .order("number", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapAmendment);
}
