import { createClient } from "@/lib/supabase/server";
import type { LotMember } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type LotMemberRow = Database["public"]["Tables"]["lot_members"]["Row"];

function mapLotMember(row: LotMemberRow): LotMember {
  return {
    id: row.id,
    lotId: row.lot_id,
    organizationId: row.organization_id,
    role: row.role,
    sharePercent: row.share_percent ?? undefined,
  };
}

export async function getLotMembers(lotIds: string[]): Promise<LotMember[]> {
  if (lotIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("lot_members").select("*").in("lot_id", lotIds);
  if (error) throw error;
  return (data ?? []).map(mapLotMember);
}
