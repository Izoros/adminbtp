import { createClient } from "@/lib/supabase/server";
import type { LotScheduleNote, TechnicalOpinion } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type LotScheduleNoteRow = Database["public"]["Tables"]["lot_schedule_notes"]["Row"];
type TechnicalOpinionRow = Database["public"]["Tables"]["technical_opinions"]["Row"];

function mapLotScheduleNote(row: LotScheduleNoteRow): LotScheduleNote {
  return {
    id: row.id,
    lotId: row.lot_id,
    week: row.week,
    note: row.note,
    needsLotId: row.needs_lot_id ?? undefined,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
  };
}

function mapTechnicalOpinion(row: TechnicalOpinionRow): TechnicalOpinion {
  return {
    id: row.id,
    siteId: row.site_id,
    lotId: row.lot_id ?? undefined,
    documentId: row.document_id ?? undefined,
    issuerOrganizationId: row.issuer_organization_id,
    issuerRole: row.issuer_role,
    kind: row.kind,
    verdict: row.verdict ?? undefined,
    text: row.text,
    status: row.status,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
  };
}

export async function getLotScheduleNotes(lotIds: string[]): Promise<LotScheduleNote[]> {
  if (lotIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lot_schedule_notes")
    .select("*")
    .in("lot_id", lotIds)
    .order("week", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapLotScheduleNote);
}

export async function getTechnicalOpinionsBySite(siteId: string): Promise<TechnicalOpinion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("technical_opinions")
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapTechnicalOpinion);
}
