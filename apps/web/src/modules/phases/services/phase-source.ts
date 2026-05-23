import type { SupabaseClient } from "@supabase/supabase-js";

import { loadServerProjectScope } from "@/lib/permissions";
import {
  demoPhaseAlerts,
  demoPhaseChecklistItems,
  demoProjectPhases,
} from "@/modules/phases/services/demo-phases";
import { getPhaseProfileFromProjectRole } from "@/modules/phases/services/phase-rules";
import type {
  PhaseAlert,
  PhaseChecklistItem,
  ProjectPhase,
} from "@/modules/phases/types/project-phase";
import type { ProjectRole } from "@/modules/projects/types/project";
import type { SupabaseDatabase } from "@/types/supabase";

type PhaseTables = SupabaseDatabase["public"]["Tables"];
type ProjectPhaseRow = PhaseTables["project_phases"]["Row"];
type ProjectPhaseTemplateRow = PhaseTables["project_phase_templates"]["Row"];
type PhaseChecklistItemRow = PhaseTables["phase_checklist_items"]["Row"];
type PhaseAlertRow = PhaseTables["phase_alerts"]["Row"];

export type PhaseDataSource = "supabase" | "demo";

export type PhaseDashboardData = {
  activeRole: ProjectRole;
  phases: ProjectPhase[];
  checklistItems: PhaseChecklistItem[];
  alerts: PhaseAlert[];
  source: PhaseDataSource;
  sourceDetail: string;
};

type PhaseSnapshot = {
  activeRole: ProjectRole | null;
  phases: ProjectPhase[];
  checklistItems: PhaseChecklistItem[];
  alerts: PhaseAlert[];
};

function mapProjectPhaseRow(
  row: ProjectPhaseRow,
  template: ProjectPhaseTemplateRow,
): ProjectPhase {
  return {
    id: row.id,
    projectId: row.project_id,
    profile: row.profile,
    code: template.code,
    title: template.title,
    description: template.description ?? "",
    sequenceNumber: template.sequence_number,
    status: row.status,
  };
}

function mapChecklistRow(row: PhaseChecklistItemRow): PhaseChecklistItem {
  return {
    id: row.id,
    phaseId: row.phase_id,
    label: row.label,
    isRequired: row.is_required,
    isCompleted: row.is_completed,
  };
}

function mapAlertRow(row: PhaseAlertRow): PhaseAlert {
  return {
    id: row.id,
    phaseId: row.phase_id,
    severity: row.severity,
    title: row.title,
    message: row.message,
    isResolved: row.is_resolved,
  };
}

function buildDemoPhaseDashboardData(sourceDetail: string): PhaseDashboardData {
  return {
    activeRole: "moe",
    phases: demoProjectPhases,
    checklistItems: demoPhaseChecklistItems,
    alerts: demoPhaseAlerts,
    source: "demo",
    sourceDetail,
  };
}

function normalizePhaseSnapshot(snapshot: PhaseSnapshot): PhaseSnapshot {
  const availablePhaseIds = new Set(snapshot.phases.map((phase) => phase.id));

  return {
    activeRole: snapshot.activeRole,
    phases: [...snapshot.phases].sort(
      (left, right) => left.sequenceNumber - right.sequenceNumber,
    ),
    checklistItems: snapshot.checklistItems.filter((item) =>
      availablePhaseIds.has(item.phaseId),
    ),
    alerts: snapshot.alerts.filter((alert) => availablePhaseIds.has(alert.phaseId)),
  };
}

export function resolvePhaseDashboardData(
  snapshot: PhaseSnapshot,
): PhaseDashboardData {
  const normalizedSnapshot = normalizePhaseSnapshot(snapshot);

  if (!normalizedSnapshot.activeRole) {
    return buildDemoPhaseDashboardData(
      "Aucun role chantier compatible n'a ete trouve, utilisation du mode demonstration.",
    );
  }

  if (normalizedSnapshot.phases.length === 0) {
    return buildDemoPhaseDashboardData(
      "Base vide ou non exploitable pour les phases chantier, bascule sur les donnees de demonstration.",
    );
  }

  return {
    activeRole: normalizedSnapshot.activeRole,
    phases: normalizedSnapshot.phases,
    checklistItems: normalizedSnapshot.checklistItems,
    alerts: normalizedSnapshot.alerts,
    source: "supabase",
    sourceDetail: `${normalizedSnapshot.phases.length} phase(s) chargee(s) depuis Supabase pour le role ${normalizedSnapshot.activeRole}.`,
  };
}

export async function loadPhaseDashboardData(
  supabase: SupabaseClient<SupabaseDatabase> | null,
  organizationIds: string[],
): Promise<PhaseDashboardData> {
  if (!supabase) {
    return buildDemoPhaseDashboardData(
      "Configuration Supabase absente, utilisation du mode demonstration.",
    );
  }

  const scopedOrganizationIds = Array.from(new Set(organizationIds));

  if (scopedOrganizationIds.length === 0) {
    return buildDemoPhaseDashboardData(
      "Aucune organisation accessible pour charger les phases, utilisation du mode demonstration.",
    );
  }

  const projectScope = await loadServerProjectScope(supabase, scopedOrganizationIds);

  if (!projectScope) {
    return buildDemoPhaseDashboardData(
      "Lecture du scope projet indisponible, utilisation du mode demonstration.",
    );
  }

  const selectedMembership =
    projectScope.memberships.find((membership) =>
      Boolean(getPhaseProfileFromProjectRole(membership.role)),
    ) ?? projectScope.memberships[0];

  if (!selectedMembership) {
    return resolvePhaseDashboardData({
      activeRole: null,
      phases: [],
      checklistItems: [],
      alerts: [],
    });
  }

  const { data: phaseRows, error: phaseError } = await supabase
    .from("project_phases")
    .select("*")
    .eq("project_id", selectedMembership.projectId)
    .order("created_at", { ascending: true });

  if (phaseError) {
    return buildDemoPhaseDashboardData(
      "Lecture des phases chantier indisponible, utilisation du mode demonstration.",
    );
  }

  const templateIds = Array.from(
    new Set((phaseRows ?? []).map((row) => row.template_id)),
  );

  if (templateIds.length === 0) {
    return resolvePhaseDashboardData({
      activeRole: selectedMembership.role,
      phases: [],
      checklistItems: [],
      alerts: [],
    });
  }

  const [{ data: templateRows, error: templateError }, { data: checklistRows, error: checklistError }, { data: alertRows, error: alertError }] =
    await Promise.all([
      supabase
        .from("project_phase_templates")
        .select("*")
        .in("id", templateIds)
        .order("sequence_number", { ascending: true }),
      supabase
        .from("phase_checklist_items")
        .select("*")
        .in(
          "phase_id",
          (phaseRows ?? []).map((row) => row.id),
        )
        .order("sequence_number", { ascending: true }),
      supabase
        .from("phase_alerts")
        .select("*")
        .in(
          "phase_id",
          (phaseRows ?? []).map((row) => row.id),
        )
        .order("created_at", { ascending: false }),
    ]);

  if (templateError || checklistError || alertError) {
    return buildDemoPhaseDashboardData(
      "Lecture des checklists ou alertes chantier indisponible, utilisation du mode demonstration.",
    );
  }

  const templatesById = new Map(
    (templateRows ?? []).map((row) => [row.id, row]),
  );

  return resolvePhaseDashboardData({
    activeRole: selectedMembership.role,
    phases: (phaseRows ?? [])
      .map((row) => {
        const template = templatesById.get(row.template_id);

        if (!template) {
          return null;
        }

        return mapProjectPhaseRow(row, template);
      })
      .filter((phase): phase is ProjectPhase => phase !== null),
    checklistItems: (checklistRows ?? []).map(mapChecklistRow),
    alerts: (alertRows ?? []).map(mapAlertRow),
  });
}
