import { createClient } from "@/lib/supabase/server";
import type { ActTemplate } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type ActTemplateRow = Database["public"]["Tables"]["act_templates"]["Row"];

function mapActTemplate(row: ActTemplateRow): ActTemplate {
  return {
    id: row.id,
    missionFamily: row.mission_family,
    code: row.code,
    label: row.label,
    documentCategory: row.document_category,
    requiredMissionRole: row.required_mission_role,
    dependsOnActCode: row.depends_on_act_code ?? undefined,
    unlocksPhaseTemplateCode: row.unlocks_phase_template_code ?? undefined,
    sortOrder: row.sort_order,
  };
}

export async function getActTemplates(missionFamily?: string): Promise<ActTemplate[]> {
  const supabase = await createClient();
  let query = supabase.from("act_templates").select("*").order("sort_order");
  if (missionFamily) query = query.eq("mission_family", missionFamily);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapActTemplate);
}
