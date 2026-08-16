import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { calculateCriticalPath } from "@/modules/opc/domain/cpm";
import { OpcDependencyError } from "@/modules/opc/domain/dependency-graph";
import type {
  OpcScheduleResult,
  OpcWorkspaceSnapshot,
} from "@/modules/opc/domain/types";
import type { Json, SupabaseDatabase } from "@/types/supabase";

export type OpcProjectOption = {
  id: string;
  code: string;
  name: string;
};

export type OpcModuleData = {
  projects: OpcProjectOption[];
  selectedProjectId: string | null;
  workspace: OpcWorkspaceSnapshot | null;
  schedule: OpcScheduleResult[];
  canEdit: boolean;
  canContribute: boolean;
  status:
    "ready" | "empty" | "setup_required" | "unavailable" | "invalid_network";
  detail: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseOpcWorkspace(value: Json): OpcWorkspaceSnapshot | null {
  if (!isRecord(value) || !isRecord(value.project)) return null;

  const project = value.project;
  if (
    typeof project.id !== "string" ||
    typeof project.code !== "string" ||
    typeof project.name !== "string" ||
    !Array.isArray(value.tasks) ||
    !Array.isArray(value.dependencies) ||
    !Array.isArray(value.actions) ||
    !Array.isArray(value.prerequisites) ||
    !Array.isArray(value.delays) ||
    !Array.isArray(value.reservations) ||
    !Array.isArray(value.receptions) ||
    !Array.isArray(value.lots) ||
    !Array.isArray(value.zones) ||
    !Array.isArray(value.meetings) ||
    !Array.isArray(value.planningVersions)
  ) {
    return null;
  }

  return value as unknown as OpcWorkspaceSnapshot;
}

function buildResult(
  input: Partial<OpcModuleData> & Pick<OpcModuleData, "status" | "detail">,
): OpcModuleData {
  return {
    projects: input.projects ?? [],
    selectedProjectId: input.selectedProjectId ?? null,
    workspace: input.workspace ?? null,
    schedule: input.schedule ?? [],
    canEdit: input.canEdit ?? false,
    canContribute: input.canContribute ?? false,
    status: input.status,
    detail: input.detail,
  };
}

export async function loadOpcModuleData(
  supabase: SupabaseClient<SupabaseDatabase> | null,
  requestedProjectId?: string,
): Promise<OpcModuleData> {
  if (!supabase) {
    return buildResult({
      status: "unavailable",
      detail:
        "Configuration Supabase absente. L'espace OPC ne peut pas charger de chantier.",
    });
  }

  const { data: projectsData, error: projectsError } = await supabase
    .from("projects")
    .select("id, code, name")
    .order("name", { ascending: true });

  if (projectsError) {
    return buildResult({
      status: "unavailable",
      detail: "La liste des chantiers autorises n'a pas pu etre chargee.",
    });
  }

  const projects = projectsData ?? [];
  const selectedProjectId = projects.some(
    (project) => project.id === requestedProjectId,
  )
    ? requestedProjectId!
    : (projects[0]?.id ?? null);

  if (!selectedProjectId) {
    return buildResult({
      projects,
      status: "empty",
      detail:
        "Aucun chantier accessible. Creez ou rattachez d'abord un chantier.",
    });
  }

  const [workspaceResult, editResult, contributionResult] = await Promise.all([
    supabase.rpc("get_opc_workspace", { target_project_id: selectedProjectId }),
    supabase.rpc("can_edit_opc_project", {
      target_project_id: selectedProjectId,
    }),
    supabase.rpc("can_contribute_opc_project", {
      target_project_id: selectedProjectId,
    }),
  ]);

  if (workspaceResult.error) {
    const migrationMissing =
      workspaceResult.error.code === "42883" ||
      workspaceResult.error.code === "PGRST202";
    return buildResult({
      projects,
      selectedProjectId,
      status: migrationMissing ? "setup_required" : "unavailable",
      detail: migrationMissing
        ? "La migration OPC doit etre appliquee a Supabase avant la premiere utilisation."
        : "Le chantier OPC n'a pas pu etre lu avec les droits de cette session.",
    });
  }

  const workspace = parseOpcWorkspace(workspaceResult.data);
  if (!workspace) {
    return buildResult({
      projects,
      selectedProjectId,
      status: "unavailable",
      detail: "Le format du snapshot OPC retourne par Supabase est invalide.",
    });
  }

  try {
    const schedule = workspace.project.startsOn
      ? calculateCriticalPath({
          projectStart: workspace.project.startsOn,
          tasks: workspace.tasks,
          dependencies: workspace.dependencies,
        })
      : [];

    return buildResult({
      projects,
      selectedProjectId,
      workspace,
      schedule,
      canEdit: editResult.data === true,
      canContribute: contributionResult.data === true,
      status: "ready",
      detail:
        workspace.tasks.length > 0
          ? `${workspace.tasks.length} tache(s) ordonnancee(s) depuis Supabase.`
          : "Chantier charge. Données insuffisantes tant que le planning ne contient aucune tache.",
    });
  } catch (error) {
    if (error instanceof OpcDependencyError) {
      return buildResult({
        projects,
        selectedProjectId,
        workspace,
        status: "invalid_network",
        detail: error.message,
      });
    }

    throw error;
  }
}
