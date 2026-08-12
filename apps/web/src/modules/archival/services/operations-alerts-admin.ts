import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  OperationsAlertKind,
  OperationsAlertSeverity,
  OperationsAlertsAccessResult,
  OperationsAlertsData,
  OperationsAlertStatus,
  OperationsAlertView,
} from "@/modules/archival/types/operations-alert";
import type { SupabaseDatabase } from "@/types/supabase";

type OperationsAlertRow =
  SupabaseDatabase["public"]["Tables"]["operations_alerts"]["Row"];

const ALERT_HISTORY_LIMIT = 100;

function normalizeKind(value: string): OperationsAlertKind {
  if (value === "archive_failed" || value === "archive_stalled") {
    return value;
  }

  return "archive_overdue";
}

function normalizeSeverity(value: string): OperationsAlertSeverity {
  return value === "high" ? "high" : "medium";
}

function normalizeStatus(value: string): OperationsAlertStatus {
  if (
    value === "dispatching" ||
    value === "delivered" ||
    value === "failed"
  ) {
    return value;
  }

  return "pending";
}

export function mapOperationsAlertRow(
  row: OperationsAlertRow,
): OperationsAlertView {
  return {
    id: row.id,
    kind: normalizeKind(row.alert_kind),
    severity: normalizeSeverity(row.severity),
    title: row.title,
    sourceEntityId: row.source_entity_id,
    occurredAt: row.occurred_at,
    status: normalizeStatus(row.status),
    attempts: row.attempts,
    lastAttemptAt: row.last_attempt_at,
    deliveredAt: row.delivered_at,
    lastError: row.last_error,
  };
}

export function buildOperationsAlertsData(
  rows: OperationsAlertRow[],
  now = new Date(),
): OperationsAlertsData {
  const alerts = [...rows]
    .sort(
      (firstRow, secondRow) =>
        new Date(secondRow.occurred_at).getTime() -
        new Date(firstRow.occurred_at).getTime(),
    )
    .map(mapOperationsAlertRow);

  return {
    updatedAt: now.toISOString(),
    sourceMessage:
      alerts.length > 0
        ? `${alerts.length} alerte(s) d'exploitation chargee(s) depuis Supabase.`
        : "L'outbox d'alertes est accessible mais encore vide.",
    totalAlerts: alerts.length,
    deliveredAlerts: alerts.filter((alert) => alert.status === "delivered").length,
    failedAlerts: alerts.filter((alert) => alert.status === "failed").length,
    activeAlerts: alerts.filter(
      (alert) => alert.status === "pending" || alert.status === "dispatching",
    ).length,
    alerts,
  };
}

async function isCurrentUserPlatformAdmin(
  supabase: SupabaseClient<SupabaseDatabase>,
) {
  const { data, error } = await supabase.rpc("is_platform_admin");
  return error ? null : data === true;
}

export async function loadOperationsAlertsData(): Promise<OperationsAlertsAccessResult> {
  const sessionClient = await createClient();

  if (!sessionClient) {
    return {
      access: "unavailable",
      message: "Configuration Supabase indisponible pour verifier l'acces admin.",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await sessionClient.auth.getUser();

  if (userError || !user) {
    return {
      access: "unauthenticated",
      message: "Une session Supabase est requise pour consulter les alertes.",
    };
  }

  const isPlatformAdmin = await isCurrentUserPlatformAdmin(sessionClient);

  if (isPlatformAdmin === null) {
    return { access: "unavailable", message: "Le role plateforme n'a pas pu etre verifie." };
  }

  if (!isPlatformAdmin) {
    return {
      access: "forbidden",
      message: "Les alertes d'exploitation sont reservees aux administrateurs plateforme.",
    };
  }

  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    return {
      access: "unavailable",
      message: "Le lecteur serveur des alertes n'est pas configure.",
    };
  }

  const { data, error } = await adminClient
    .from("operations_alerts")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(ALERT_HISTORY_LIMIT);

  if (error) {
    return {
      access: "unavailable",
      message: "L'outbox des alertes n'a pas pu etre chargee.",
    };
  }

  return { access: "ready", data: buildOperationsAlertsData(data ?? []) };
}
