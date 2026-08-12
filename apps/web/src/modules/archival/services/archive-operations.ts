import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  ArchiveOperationsAccessResult,
  ArchiveOperationsData,
  ArchiveRunStatus,
  ArchiveRunView,
  ArchiveVerificationStatus,
} from "@/modules/archival/types/archive-operations";
import type { SupabaseDatabase } from "@/types/supabase";

type ArchiveRunRow = SupabaseDatabase["public"]["Tables"]["archive_runs"]["Row"];

const STALLED_RUN_THRESHOLD_MS = 15 * 60 * 1_000;
const EXPECTED_DAILY_ARCHIVE_MS = 26 * 60 * 60 * 1_000;
const ARCHIVE_HISTORY_LIMIT = 50;

function normalizeRunStatus(status: string): ArchiveRunStatus {
  if (status === "running" || status === "succeeded") {
    return status;
  }

  return "failed";
}

function normalizeVerificationStatus(status: string): ArchiveVerificationStatus {
  if (status === "pending" || status === "verified") {
    return status;
  }

  return "failed";
}

function isRunStalled(row: ArchiveRunRow, now: Date) {
  return (
    row.status === "running" &&
    now.getTime() - new Date(row.started_at).getTime() > STALLED_RUN_THRESHOLD_MS
  );
}

export function mapArchiveRunRow(row: ArchiveRunRow, now = new Date()): ArchiveRunView {
  return {
    id: row.id,
    status: normalizeRunStatus(row.status),
    verificationStatus: normalizeVerificationStatus(row.verification_status),
    storageMode: row.storage_mode === "sftp" ? "sftp" : "local",
    generatedAt: row.generated_at,
    completedAt: row.completed_at,
    verifiedAt: row.verified_at,
    fileName: row.file_name,
    storagePath: row.storage_path,
    sha256: row.sha256,
    byteLength: row.byte_length,
    errorMessage: row.error_message,
    isStalled: isRunStalled(row, now),
  };
}

function resolveArchiveHealth(
  runs: ArchiveRunView[],
  now: Date,
): Pick<ArchiveOperationsData, "health" | "healthLabel"> {
  if (runs.length === 0) {
    return {
      health: "empty",
      healthLabel: "Aucune execution",
    };
  }

  const latestRun = runs[0];

  if (runs.some((run) => run.isStalled) || latestRun?.status === "failed") {
    return {
      health: "critical",
      healthLabel: "Intervention requise",
    };
  }

  const lastSucceededRun = runs.find((run) => run.status === "succeeded");

  if (
    !lastSucceededRun ||
    now.getTime() - new Date(lastSucceededRun.generatedAt).getTime() >
      EXPECTED_DAILY_ARCHIVE_MS
  ) {
    return {
      health: "attention",
      healthLabel: "Archive quotidienne en retard",
    };
  }

  return {
    health: "healthy",
    healthLabel: "Archivage operationnel",
  };
}

export function buildArchiveOperationsData(
  rows: ArchiveRunRow[],
  now = new Date(),
): ArchiveOperationsData {
  const runs = [...rows]
    .sort(
      (firstRow, secondRow) =>
        new Date(secondRow.generated_at).getTime() -
        new Date(firstRow.generated_at).getTime(),
    )
    .map((row) => mapArchiveRunRow(row, now));
  const health = resolveArchiveHealth(runs, now);
  const succeededRuns = runs.filter((run) => run.status === "succeeded");
  const failedRuns = runs.filter((run) => run.status === "failed");
  const stalledRuns = runs.filter((run) => run.isStalled);

  return {
    access: "ready",
    ...health,
    sourceMessage:
      runs.length > 0
        ? `${runs.length} execution(s) d'archive chargee(s) depuis Supabase.`
        : "Le journal d'archivage est accessible mais encore vide.",
    updatedAt: now.toISOString(),
    totalRuns: runs.length,
    succeededRuns: succeededRuns.length,
    failedRuns: failedRuns.length,
    stalledRuns: stalledRuns.length,
    lastSucceededAt: succeededRuns[0]?.generatedAt ?? null,
    runs,
  };
}

async function isCurrentUserPlatformAdmin(
  supabase: SupabaseClient<SupabaseDatabase>,
) {
  const { data, error } = await supabase.rpc("is_platform_admin");

  if (error) {
    return null;
  }

  return data === true;
}

export async function loadArchiveOperationsData(): Promise<ArchiveOperationsAccessResult> {
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
      message: "Une session Supabase est requise pour consulter les archives.",
    };
  }

  const isPlatformAdmin = await isCurrentUserPlatformAdmin(sessionClient);

  if (isPlatformAdmin === null) {
    return {
      access: "unavailable",
      message: "Le role plateforme n'a pas pu etre verifie.",
    };
  }

  if (!isPlatformAdmin) {
    return {
      access: "forbidden",
      message: "Le journal d'archivage est reserve aux administrateurs plateforme.",
    };
  }

  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    return {
      access: "unavailable",
      message: "Le lecteur serveur des archives n'est pas configure.",
    };
  }

  const { data, error } = await adminClient
    .from("archive_runs")
    .select("*")
    .order("generated_at", { ascending: false })
    .limit(ARCHIVE_HISTORY_LIMIT);

  if (error) {
    return {
      access: "unavailable",
      message: "Le journal d'archivage n'a pas pu etre charge.",
    };
  }

  return {
    access: "ready",
    data: buildArchiveOperationsData(data ?? []),
  };
}
