import { createClient } from "@/lib/supabase/server";
import type { PhaseTemplate, PhaseInstance, ChecklistItem } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type PhaseTemplateRow = Database["public"]["Tables"]["phase_templates"]["Row"];
type PhaseInstanceRow = Database["public"]["Tables"]["phase_instances"]["Row"];

function mapPhaseTemplate(row: PhaseTemplateRow): PhaseTemplate {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    description: row.description ?? undefined,
    defaultDurationDays: row.default_duration_days ?? undefined,
  };
}

function mapPhaseInstance(row: PhaseInstanceRow): PhaseInstance {
  return {
    id: row.id,
    siteId: row.site_id,
    phaseTemplateId: row.phase_template_id,
    status: row.status,
    startDate: row.start_date ?? undefined,
    endDateTarget: row.end_date_target ?? undefined,
    endDateActual: row.end_date_actual ?? undefined,
    responsibleUserId: row.responsible_user_id ?? undefined,
    checklist: (row.checklist as ChecklistItem[]) ?? [],
    expectedDocumentTypes: row.expected_document_types ?? [],
    dependsOnPhaseInstanceIds: row.depends_on_phase_instance_ids ?? [],
  };
}

export async function getPhaseTemplates(): Promise<PhaseTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("phase_templates").select("*");
  if (error) throw error;
  return (data ?? []).map(mapPhaseTemplate);
}

export async function getPhaseInstances(siteId: string): Promise<PhaseInstance[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("phase_instances")
    .select("*")
    .eq("site_id", siteId)
    .order("start_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map(mapPhaseInstance);
}
