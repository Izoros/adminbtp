import "server-only";

import { isIP } from "node:net";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  OperationsAlertCandidate,
  OperationsAlertScanResult,
} from "@/modules/archival/types/operations-alert";
import type { SupabaseDatabase } from "@/types/supabase";

type SupabaseAdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;
type ArchiveRunRow = SupabaseDatabase["public"]["Tables"]["archive_runs"]["Row"];

const STALLED_RUN_THRESHOLD_MS = 15 * 60 * 1_000;
const EXPECTED_DAILY_ARCHIVE_MS = 26 * 60 * 60 * 1_000;
const RECENT_FAILURE_LOOKBACK_MS = 48 * 60 * 60 * 1_000;
const ARCHIVE_HISTORY_LIMIT = 100;

type ActiveAlertConfig = {
  mode: "active";
  webhookUrl: string;
  webhookToken: string;
};

type AlertConfig =
  | ActiveAlertConfig
  | { mode: "disabled"; reason: string }
  | { mode: "invalid"; reason: string };

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".").map(Number);

  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && (parts[1] ?? 0) >= 16 && (parts[1] ?? 0) <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

function isLocalOrPrivateHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  const ipVersion = isIP(normalized);

  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "::1"
  ) {
    return true;
  }

  if (ipVersion === 4) {
    return isPrivateIpv4(normalized);
  }

  return ipVersion === 6;
}

export function resolveOperationsAlertConfig(): AlertConfig {
  if (readEnv("ADMINBTP_OPERATIONS_ALERTS_ENABLED") !== "true") {
    return {
      mode: "disabled",
      reason: "Alertes d'exploitation desactivees.",
    };
  }

  const webhookUrlValue = readEnv("ADMINBTP_OPERATIONS_ALERT_WEBHOOK_URL");
  const webhookToken = readEnv("ADMINBTP_OPERATIONS_ALERT_WEBHOOK_TOKEN");
  const allowedHosts = new Set(
    (readEnv("ADMINBTP_OPERATIONS_ALERT_ALLOWED_HOSTS") ?? "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  );

  if (!webhookUrlValue || !webhookToken || allowedHosts.size === 0) {
    return {
      mode: "invalid",
      reason: "URL, token ou liste d'hotes d'alerte manquant.",
    };
  }

  let webhookUrl: URL;

  try {
    webhookUrl = new URL(webhookUrlValue);
  } catch {
    return { mode: "invalid", reason: "URL d'alerte invalide." };
  }

  if (
    webhookUrl.protocol !== "https:" ||
    webhookUrl.username ||
    webhookUrl.password ||
    isLocalOrPrivateHost(webhookUrl.hostname) ||
    !allowedHosts.has(webhookUrl.hostname.toLowerCase())
  ) {
    return {
      mode: "invalid",
      reason: "La destination d'alerte doit etre HTTPS et explicitement autorisee.",
    };
  }

  return {
    mode: "active",
    webhookUrl: webhookUrl.toString(),
    webhookToken,
  };
}

export function buildArchiveAlertCandidates(
  rows: ArchiveRunRow[],
  now = new Date(),
): OperationsAlertCandidate[] {
  const candidates: OperationsAlertCandidate[] = [];
  const recentThreshold = now.getTime() - RECENT_FAILURE_LOOKBACK_MS;

  for (const row of rows) {
    const generatedAt = new Date(row.generated_at).getTime();

    if (generatedAt < recentThreshold) {
      continue;
    }

    if (row.status === "failed") {
      candidates.push({
        fingerprint: `archive_failed:${row.id}`,
        kind: "archive_failed",
        severity: "high",
        title: "Une archive AdminBTP a echoue",
        sourceEntityId: row.id,
        occurredAt: row.completed_at ?? row.generated_at,
      });
      continue;
    }

    if (
      row.status === "running" &&
      now.getTime() - new Date(row.started_at).getTime() >
        STALLED_RUN_THRESHOLD_MS
    ) {
      candidates.push({
        fingerprint: `archive_stalled:${row.id}`,
        kind: "archive_stalled",
        severity: "high",
        title: "Une archive AdminBTP semble bloquee",
        sourceEntityId: row.id,
        occurredAt: row.started_at,
      });
    }
  }

  const latestSucceededRun = [...rows]
    .filter((row) => row.status === "succeeded")
    .sort(
      (firstRow, secondRow) =>
        new Date(secondRow.generated_at).getTime() -
        new Date(firstRow.generated_at).getTime(),
    )[0];

  if (
    !latestSucceededRun ||
    now.getTime() - new Date(latestSucceededRun.generated_at).getTime() >
      EXPECTED_DAILY_ARCHIVE_MS
  ) {
    const dateKey = now.toISOString().slice(0, 10);
    candidates.push({
      fingerprint: `archive_overdue:${latestSucceededRun?.id ?? "none"}:${dateKey}`,
      kind: "archive_overdue",
      severity: "medium",
      title: "L'archive quotidienne AdminBTP est en retard",
      sourceEntityId: latestSucceededRun?.id ?? null,
      occurredAt: now.toISOString(),
    });
  }

  return candidates;
}

async function dispatchAlert(
  supabase: SupabaseAdminClient,
  candidate: OperationsAlertCandidate,
  config: ActiveAlertConfig,
  fetcher: typeof fetch,
) {
  const { data: claimedRows, error: claimError } = await supabase.rpc(
    "claim_operations_alert",
    {
      target_fingerprint: candidate.fingerprint,
      target_alert_kind: candidate.kind,
      target_severity: candidate.severity,
      target_title: candidate.title,
      // PostgreSQL accepte NULL ici, mais le generateur Supabase ne modelise pas
      // la nullabilite des arguments de fonction sans valeur par defaut.
      target_source_entity_id: candidate.sourceEntityId as string,
      target_occurred_at: candidate.occurredAt,
    },
  );

  if (claimError) {
    throw new Error("Reservation de l'alerte impossible.");
  }

  const claimedAlert = claimedRows?.[0];

  if (!claimedAlert) {
    return "deduplicated" as const;
  }

  const body = JSON.stringify({
    schemaVersion: 1,
    alertId: claimedAlert.id,
    kind: candidate.kind,
    severity: candidate.severity,
    title: candidate.title,
    occurredAt: candidate.occurredAt,
    sourceEntityId: candidate.sourceEntityId,
  });

  try {
    const response = await fetcher(config.webhookUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.webhookToken}`,
        "content-type": "application/json",
        "x-adminbtp-alert-id": claimedAlert.id,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const deliveredAt = new Date().toISOString();
    const { error } = await supabase
      .from("operations_alerts")
      .update({
        status: "delivered",
        delivered_at: deliveredAt,
        updated_at: deliveredAt,
        last_error: null,
      })
      .eq("id", claimedAlert.id);

    if (error) {
      throw new Error("Finalisation de l'alerte impossible.");
    }

    return "delivered" as const;
  } catch (error) {
    const failedAt = new Date().toISOString();
    await supabase
      .from("operations_alerts")
      .update({
        status: "failed",
        updated_at: failedAt,
        last_error: error instanceof Error ? error.message.slice(0, 240) : "dispatch_failed",
      })
      .eq("id", claimedAlert.id);

    return "failed" as const;
  }
}

export async function runOperationsAlertScan(options?: {
  adminClient?: SupabaseAdminClient;
  fetcher?: typeof fetch;
  now?: Date;
}): Promise<OperationsAlertScanResult> {
  const config = resolveOperationsAlertConfig();

  if (config.mode === "disabled") {
    return {
      ok: true,
      mode: "disabled",
      evaluated: 0,
      delivered: 0,
      deduplicated: 0,
      failed: 0,
      skippedReason: config.reason,
    };
  }

  if (config.mode === "invalid") {
    throw new Error(config.reason);
  }

  if (readEnv("MARKET_ARCHIVE_ENABLED") !== "true") {
    return {
      ok: true,
      mode: "disabled",
      evaluated: 0,
      delivered: 0,
      deduplicated: 0,
      failed: 0,
      skippedReason: "Archivage desactive; aucune alerte archive n'est emise.",
    };
  }

  const supabase = options?.adminClient ?? createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase admin indisponible pour analyser les alertes.");
  }

  const { data, error } = await supabase
    .from("archive_runs")
    .select("*")
    .order("generated_at", { ascending: false })
    .limit(ARCHIVE_HISTORY_LIMIT);

  if (error) {
    throw new Error("Lecture du journal d'archive impossible pour les alertes.");
  }

  const candidates = buildArchiveAlertCandidates(data ?? [], options?.now);
  let delivered = 0;
  let deduplicated = 0;
  let failed = 0;

  for (const candidate of candidates) {
    const result = await dispatchAlert(
      supabase,
      candidate,
      config,
      options?.fetcher ?? fetch,
    );

    if (result === "delivered") {
      delivered += 1;
    } else if (result === "deduplicated") {
      deduplicated += 1;
    } else {
      failed += 1;
    }
  }

  return {
    ok: failed === 0,
    mode: "active",
    evaluated: candidates.length,
    delivered,
    deduplicated,
    failed,
  };
}
