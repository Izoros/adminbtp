"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { SupabaseDatabase } from "@/types/supabase";

type RpcName =
  | "create_opc_baseline"
  | "create_opc_action"
  | "create_opc_dependency"
  | "create_opc_meeting"
  | "create_opc_reception"
  | "create_opc_reservation"
  | "declare_opc_delay"
  | "record_opc_progress"
  | "save_opc_task";

function readRequired(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readOptional(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asMayotteTimestamp(value: string): string {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
    ? `${value}:00+03:00`
    : value;
}

function redirectToOpc(projectId: string | null, result: string): never {
  const params = new URLSearchParams({ result });
  if (projectId) params.set("projectId", projectId);
  redirect(`/opc?${params.toString()}`);
}

async function authorize(projectId: string, permission: "edit" | "contribute") {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const functionName =
    permission === "edit"
      ? "can_edit_opc_project"
      : "can_contribute_opc_project";
  const { data, error } = await supabase.rpc(functionName, {
    target_project_id: projectId,
  });

  return !error && data === true ? supabase : null;
}

async function runAuthorizedRpc<Name extends RpcName>(input: {
  projectId: string;
  permission: "edit" | "contribute";
  name: Name;
  args: SupabaseDatabase["public"]["Functions"][Name]["Args"];
  successCode: string;
}) {
  const supabase = await authorize(input.projectId, input.permission);
  if (!supabase) redirectToOpc(input.projectId, "access_denied");

  const { error } = await supabase.rpc(input.name, input.args);
  if (error) {
    console.error("[AdminBTP][opc] mutation_failed", {
      functionName: input.name,
      code: error.code,
    });
    redirectToOpc(
      input.projectId,
      error.message.includes("cycle") ? "cycle" : "error",
    );
  }

  revalidatePath("/opc");
  redirectToOpc(input.projectId, input.successCode);
}

export async function saveOpcTaskAction(formData: FormData) {
  const projectId = readRequired(formData, "projectId");
  const code = readRequired(formData, "code");
  const name = readRequired(formData, "name");
  const plannedStart = readRequired(formData, "plannedStart");
  const plannedEnd = readRequired(formData, "plannedEnd");

  if (!projectId || !code || !name || !plannedStart || !plannedEnd) {
    redirectToOpc(projectId, "invalid_task");
  }

  const durationValue = Number(readOptional(formData, "durationDays"));
  const payload = {
    id: readOptional(formData, "taskId"),
    code,
    name,
    description: readOptional(formData, "description"),
    plannedStart,
    plannedEnd,
    durationDays:
      Number.isFinite(durationValue) && durationValue >= 0
        ? durationValue
        : undefined,
    priority: readOptional(formData, "priority") ?? "normal",
    isMilestone: formData.get("isMilestone") === "on",
    isContractualMilestone: formData.get("isContractualMilestone") === "on",
  };

  return runAuthorizedRpc({
    projectId,
    permission: "edit",
    name: "save_opc_task",
    args: { target_project_id: projectId, target_payload: payload },
    successCode: "task_saved",
  });
}

export async function createOpcDependencyAction(formData: FormData) {
  const projectId = readRequired(formData, "projectId");
  const predecessorId = readRequired(formData, "predecessorId");
  const successorId = readRequired(formData, "successorId");
  const dependencyType = readOptional(formData, "dependencyType") ?? "FS";
  const lagDays = Number(readOptional(formData, "lagDays") ?? 0);

  if (
    !projectId ||
    !predecessorId ||
    !successorId ||
    !["FS", "SS", "FF", "SF"].includes(dependencyType)
  ) {
    redirectToOpc(projectId, "invalid_dependency");
  }

  return runAuthorizedRpc({
    projectId,
    permission: "edit",
    name: "create_opc_dependency",
    args: {
      target_project_id: projectId,
      target_predecessor_id: predecessorId,
      target_successor_id: successorId,
      target_dependency_type: dependencyType as "FS" | "SS" | "FF" | "SF",
      target_lag_days: Number.isFinite(lagDays) ? Math.trunc(lagDays) : 0,
    },
    successCode: "dependency_saved",
  });
}

export async function recordOpcProgressAction(formData: FormData) {
  const projectId = readRequired(formData, "projectId");
  const taskId = readRequired(formData, "taskId");
  const progress = Number(readRequired(formData, "progressPercent"));
  const completedQuantityValue = Number(
    readOptional(formData, "completedQuantity"),
  );

  if (
    !projectId ||
    !taskId ||
    !Number.isFinite(progress) ||
    progress < 0 ||
    progress > 100
  ) {
    redirectToOpc(projectId, "invalid_progress");
  }

  return runAuthorizedRpc({
    projectId,
    permission: "contribute",
    name: "record_opc_progress",
    args: {
      target_task_id: taskId,
      target_progress_percent: progress,
      target_completed_quantity: Number.isFinite(completedQuantityValue)
        ? completedQuantityValue
        : null,
      target_measured_on: readOptional(formData, "measuredOn") ?? undefined,
      target_comment: readOptional(formData, "comment"),
    },
    successCode: "progress_saved",
  });
}

export async function createOpcBaselineAction(formData: FormData) {
  const projectId = readRequired(formData, "projectId");
  const name = readRequired(formData, "name");
  if (!projectId || !name) redirectToOpc(projectId, "invalid_baseline");

  return runAuthorizedRpc({
    projectId,
    permission: "edit",
    name: "create_opc_baseline",
    args: {
      target_project_id: projectId,
      target_name: name,
      target_description: readOptional(formData, "description"),
    },
    successCode: "baseline_saved",
  });
}

export async function createOpcActionAction(formData: FormData) {
  const projectId = readRequired(formData, "projectId");
  const title = readRequired(formData, "title");
  const dueOn = readRequired(formData, "dueOn");
  const priority = readOptional(formData, "priority") ?? "normal";

  if (
    !projectId ||
    !title ||
    !dueOn ||
    !["low", "normal", "high", "urgent"].includes(priority)
  ) {
    redirectToOpc(projectId, "invalid_action");
  }

  return runAuthorizedRpc({
    projectId,
    permission: "contribute",
    name: "create_opc_action",
    args: {
      target_project_id: projectId,
      target_title: title,
      target_due_on: dueOn,
      target_priority: priority as "low" | "normal" | "high" | "urgent",
      target_task_id: readOptional(formData, "taskId"),
      target_assignee_organization_id: readOptional(
        formData,
        "assigneeOrganizationId",
      ),
    },
    successCode: "action_saved",
  });
}

export async function createOpcMeetingAction(formData: FormData) {
  const projectId = readRequired(formData, "projectId");
  const title = readRequired(formData, "title");
  const scheduledAt = readRequired(formData, "scheduledAt");
  const meetingType = readOptional(formData, "meetingType") ?? "site";
  if (!projectId || !title || !scheduledAt)
    redirectToOpc(projectId, "invalid_meeting");

  return runAuthorizedRpc({
    projectId,
    permission: "edit",
    name: "create_opc_meeting",
    args: {
      target_project_id: projectId,
      target_title: title,
      target_scheduled_at: asMayotteTimestamp(scheduledAt),
      target_meeting_type: meetingType,
      target_location: readOptional(formData, "location"),
    },
    successCode: "meeting_saved",
  });
}

export async function declareOpcDelayAction(formData: FormData) {
  const projectId = readRequired(formData, "projectId");
  const taskId = readRequired(formData, "taskId");
  const cause = readRequired(formData, "cause");
  const occurredOn = readRequired(formData, "occurredOn");
  const delayDays = Number(readRequired(formData, "delayDays"));
  if (
    !projectId ||
    !taskId ||
    !cause ||
    !occurredOn ||
    !Number.isInteger(delayDays) ||
    delayDays <= 0
  ) {
    redirectToOpc(projectId, "invalid_delay");
  }

  return runAuthorizedRpc({
    projectId,
    permission: "edit",
    name: "declare_opc_delay",
    args: {
      target_project_id: projectId,
      target_task_id: taskId,
      target_cause: cause,
      target_cause_category: readOptional(formData, "causeCategory") ?? "other",
      target_delay_days: delayDays,
      target_occurred_on: occurredOn,
    },
    successCode: "delay_saved",
  });
}

export async function createOpcReceptionAction(formData: FormData) {
  const projectId = readRequired(formData, "projectId");
  const title = readRequired(formData, "title");
  const receptionType = readRequired(formData, "receptionType");
  if (!projectId || !title || !receptionType)
    redirectToOpc(projectId, "invalid_reception");

  return runAuthorizedRpc({
    projectId,
    permission: "edit",
    name: "create_opc_reception",
    args: {
      target_project_id: projectId,
      target_title: title,
      target_reception_type: receptionType,
      target_planned_on: readOptional(formData, "plannedOn"),
    },
    successCode: "reception_saved",
  });
}

export async function createOpcReservationAction(formData: FormData) {
  const projectId = readRequired(formData, "projectId");
  const reference = readRequired(formData, "reference");
  const title = readRequired(formData, "title");
  if (!projectId || !reference || !title)
    redirectToOpc(projectId, "invalid_reservation");

  return runAuthorizedRpc({
    projectId,
    permission: "edit",
    name: "create_opc_reservation",
    args: {
      target_project_id: projectId,
      target_reference: reference,
      target_title: title,
      target_severity: readOptional(formData, "severity") ?? "minor",
      target_due_on: readOptional(formData, "dueOn"),
      target_task_id: readOptional(formData, "taskId"),
      target_reception_id: readOptional(formData, "receptionId"),
    },
    successCode: "reservation_saved",
  });
}
