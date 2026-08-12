import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import SftpClient from "ssh2-sftp-client";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json, SupabaseDatabase } from "@/types/supabase";
import type {
  MarketArchiveDigest,
  MarketArchivePayload,
  MarketArchiveResult,
  MarketArchiveStorageTarget,
  MarketArchiveVerification,
} from "@/modules/archival/types/archival";

type SupabaseAdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;
type OrganizationArchiveRow = SupabaseDatabase["public"]["Tables"]["organizations"]["Row"];
type ArchiveRunInsert = SupabaseDatabase["public"]["Tables"]["archive_runs"]["Insert"];

const DEFAULT_RETENTION_YEARS = 25;
const DEFAULT_REMOTE_BASE_PATH = "/adminbtp/archives";
const DEFAULT_LOCAL_ARCHIVE_BASE_PATH = "/market-archive";
const MARKET_ARCHIVE_VERSION = 1;

function readRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

export function resolveMarketArchiveStorageTarget(): MarketArchiveStorageTarget {
  const enabled = readRequiredEnv("MARKET_ARCHIVE_ENABLED");

  if (enabled !== "true") {
    return { mode: "disabled" };
  }

  const localDirectory = readRequiredEnv("MARKET_ARCHIVE_LOCAL_DIR");

  if (localDirectory) {
    return {
      mode: "local",
      localDirectory,
    };
  }

  const host = readRequiredEnv("MARKET_ARCHIVE_SFTP_HOST");
  const username = readRequiredEnv("MARKET_ARCHIVE_SFTP_USERNAME");

  if (!host || !username) {
    return { mode: "disabled" };
  }

  return {
    mode: "sftp",
    host,
    port: Number(readRequiredEnv("MARKET_ARCHIVE_SFTP_PORT") ?? "22"),
    username,
    password: readRequiredEnv("MARKET_ARCHIVE_SFTP_PASSWORD") ?? undefined,
    privateKey: readRequiredEnv("MARKET_ARCHIVE_SFTP_PRIVATE_KEY") ?? undefined,
    remoteBasePath:
      readRequiredEnv("MARKET_ARCHIVE_REMOTE_BASE_PATH") ?? DEFAULT_REMOTE_BASE_PATH,
  };
}

export function resolveMarketArchiveRetentionYears() {
  const value = Number(readRequiredEnv("MARKET_ARCHIVE_RETENTION_YEARS") ?? DEFAULT_RETENTION_YEARS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_RETENTION_YEARS;
}

export function buildMarketArchiveFileName(generatedAt: string) {
  const safeTimestamp = generatedAt.replaceAll(":", "-").replaceAll(".", "-");
  return `market-archive-${safeTimestamp}.json.gz`;
}

export function buildMarketArchiveRemotePath(
  generatedAt: string,
  fileName: string,
  remoteBasePath: string,
) {
  const date = new Date(generatedAt);
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${remoteBasePath}/${year}/${month}/${day}/${fileName}`;
}

export function buildMarketArchiveDigest(buffer: Buffer): MarketArchiveDigest {
  return {
    sha256: createHash("sha256").update(buffer).digest("hex"),
    byteLength: buffer.byteLength,
  };
}

export function serializeMarketArchivePayload(payload: MarketArchivePayload) {
  return Buffer.from(JSON.stringify(payload, null, 2), "utf8");
}

export function compressMarketArchivePayload(payloadBuffer: Buffer) {
  return gzipSync(payloadBuffer, {
    level: 9,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function restoreMarketArchivePayload(archiveBuffer: Buffer): MarketArchivePayload {
  let parsed: unknown;

  try {
    parsed = JSON.parse(gunzipSync(archiveBuffer).toString("utf8"));
  } catch {
    throw new Error("Archive illisible: le contenu gzip ou JSON est invalide.");
  }

  if (!isRecord(parsed) || !isRecord(parsed.metadata)) {
    throw new Error("Archive invalide: les metadonnees sont absentes.");
  }

  if (
    typeof parsed.metadata.archiveVersion !== "number" ||
    typeof parsed.metadata.generatedAt !== "string" ||
    typeof parsed.metadata.retentionYears !== "number"
  ) {
    throw new Error("Archive invalide: les metadonnees obligatoires sont incorrectes.");
  }

  const collectionNames = [
    "organizations",
    "projects",
    "documentTemplates",
    "documents",
    "signatures",
    "situations",
    "followups",
    "consultingMissions",
    "consultingHours",
    "expertRequests",
    "technicalReviews",
  ] as const;

  if (collectionNames.some((collectionName) => !Array.isArray(parsed[collectionName]))) {
    throw new Error("Archive invalide: une collection metier obligatoire est absente.");
  }

  return parsed as MarketArchivePayload;
}

export function verifyMarketArchiveArtifact(
  archiveBuffer: Buffer,
  expectedDigest: MarketArchiveDigest,
  expectedGeneratedAt: string,
): MarketArchiveVerification {
  const actualDigest = buildMarketArchiveDigest(archiveBuffer);

  if (
    actualDigest.sha256 !== expectedDigest.sha256 ||
    actualDigest.byteLength !== expectedDigest.byteLength
  ) {
    throw new Error("Verification archive impossible: le checksum ou la taille differe.");
  }

  const restoredPayload = restoreMarketArchivePayload(archiveBuffer);

  if (restoredPayload.metadata.generatedAt !== expectedGeneratedAt) {
    throw new Error("Verification archive impossible: la date de generation differe.");
  }

  return {
    status: "verified",
    verifiedAt: new Date().toISOString(),
    ...actualDigest,
  };
}

async function uploadArchiveToLocalTarget(
  target: Extract<MarketArchiveStorageTarget, { mode: "local" }>,
  remotePath: string,
  archiveBuffer: Buffer,
) {
  const localPath = join(target.localDirectory, remotePath.replace(/^\/+/, ""));
  await mkdir(join(localPath, ".."), { recursive: true });
  await writeFile(localPath, archiveBuffer);
  return {
    localPath,
    storedBuffer: await readFile(localPath),
  };
}

async function uploadArchiveToSftpTarget(
  target: Extract<MarketArchiveStorageTarget, { mode: "sftp" }>,
  remotePath: string,
  archiveBuffer: Buffer,
) {
  const sftp = new SftpClient();

  try {
    await sftp.connect({
      host: target.host,
      port: target.port,
      username: target.username,
      password: target.password,
      privateKey: target.privateKey,
    });

    const remoteDirectory = remotePath.split("/").slice(0, -1).join("/");

    if (remoteDirectory) {
      await sftp.mkdir(remoteDirectory, true);
    }

    await sftp.put(archiveBuffer, remotePath);
    const storedArchive = await sftp.get(remotePath);

    if (!Buffer.isBuffer(storedArchive)) {
      throw new Error("Verification SFTP impossible: la relecture n'a pas retourne de buffer.");
    }

    return storedArchive;
  } finally {
    await sftp.end().catch(() => undefined);
  }
}

async function createArchiveRun(
  supabase: SupabaseAdminClient,
  input: ArchiveRunInsert,
) {
  const { data, error } = await supabase
    .from("archive_runs")
    .insert(input)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Journal d'archive impossible: ${error?.message ?? "identifiant absent"}`);
  }

  return data.id;
}

async function markArchiveRunSucceeded(
  supabase: SupabaseAdminClient,
  runId: string,
  result: MarketArchiveResult,
) {
  const { error } = await supabase
    .from("archive_runs")
    .update({
      status: "succeeded",
      verification_status: "verified",
      completed_at: result.verifiedAt,
      verified_at: result.verifiedAt,
      sha256: result.sha256,
      byte_length: result.byteLength,
      summary: result.summary as Json,
      error_message: null,
    })
    .eq("id", runId);

  if (error) {
    throw new Error(`Finalisation du journal d'archive impossible: ${error.message}`);
  }
}

async function markArchiveRunFailed(
  supabase: SupabaseAdminClient,
  runId: string,
  errorMessage: string,
  digest?: MarketArchiveDigest,
) {
  const { error } = await supabase
    .from("archive_runs")
    .update({
      status: "failed",
      verification_status: "failed",
      completed_at: new Date().toISOString(),
      sha256: digest?.sha256,
      byte_length: digest?.byteLength,
      error_message: errorMessage.slice(0, 2_000),
    })
    .eq("id", runId);

  if (error) {
    throw new Error(`Echec de journalisation de l'archive en erreur: ${error.message}`);
  }
}

async function fetchArchiveRows(
  supabase: SupabaseAdminClient,
  tableName: keyof SupabaseDatabase["public"]["Tables"],
  columns = "*",
) {
  const { data, error } = await supabase.from(tableName).select(columns);

  if (error) {
    throw new Error(`Lecture impossible pour ${String(tableName)}: ${error.message}`);
  }

  return ((data ?? []) as unknown) as Record<string, unknown>[];
}

export async function buildMarketArchivePayload(
  adminClient?: SupabaseAdminClient,
  generatedAt = new Date().toISOString(),
): Promise<MarketArchivePayload> {
  const supabase = adminClient ?? createSupabaseAdminClient();

  if (!supabase) {
    throw new Error(
      "Supabase admin indisponible. NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.",
    );
  }

  const [
    organizations,
    projects,
    documentTemplates,
    documents,
    signatures,
    situations,
    followups,
    consultingMissions,
    consultingHours,
    expertRequests,
    technicalReviews,
  ] = await Promise.all([
    fetchArchiveRows(supabase, "organizations"),
    fetchArchiveRows(supabase, "projects"),
    fetchArchiveRows(supabase, "document_templates"),
    fetchArchiveRows(supabase, "documents"),
    fetchArchiveRows(supabase, "signature_requests"),
    fetchArchiveRows(supabase, "situations"),
    fetchArchiveRows(supabase, "payment_followups"),
    fetchArchiveRows(supabase, "consulting_missions"),
    fetchArchiveRows(supabase, "consulting_hours"),
    fetchArchiveRows(supabase, "expert_requests"),
    fetchArchiveRows(supabase, "technical_reviews"),
  ]);

  const mappedOrganizations = organizations as unknown as OrganizationArchiveRow[];

  return {
    metadata: {
      archiveVersion: MARKET_ARCHIVE_VERSION,
      generatedAt,
      retentionYears: resolveMarketArchiveRetentionYears(),
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      organizationCount: mappedOrganizations.length,
      projectCount: projects.length,
      documentCount: documents.length,
      signatureCount: signatures.length,
      situationCount: situations.length,
      followupCount: followups.length,
      consultingMissionCount: consultingMissions.length,
      technicalReviewCount: technicalReviews.length,
    },
    organizations: mappedOrganizations.map((organization) => ({
      id: organization.id,
      name: organization.name,
      legalName: organization.legal_name,
      isActive: organization.is_active,
    })),
    projects,
    documentTemplates,
    documents,
    signatures,
    situations,
    followups,
    consultingMissions,
    consultingHours,
    expertRequests,
    technicalReviews,
  };
}

export async function runMarketArchiveBackup(): Promise<MarketArchiveResult> {
  const target = resolveMarketArchiveStorageTarget();
  const generatedAt = new Date().toISOString();
  const fileName = buildMarketArchiveFileName(generatedAt);

  if (target.mode === "disabled") {
    return {
      ok: true,
      mode: "disabled",
      generatedAt,
      fileName,
      sha256: "",
      byteLength: 0,
      verificationStatus: "not_applicable",
      summary: {
        organizations: 0,
        projects: 0,
        documents: 0,
        signatures: 0,
        situations: 0,
        followups: 0,
        consultingMissions: 0,
        technicalReviews: 0,
      },
      skippedReason:
        "Archivage des marches desactive. Definir MARKET_ARCHIVE_ENABLED=true pour activer le cron.",
    };
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error(
      "Supabase admin indisponible. NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.",
    );
  }

  const remotePath = buildMarketArchiveRemotePath(
    generatedAt,
    fileName,
    target.mode === "local" ? DEFAULT_LOCAL_ARCHIVE_BASE_PATH : target.remoteBasePath,
  );
  const runId = await createArchiveRun(supabase, {
    status: "running",
    storage_mode: target.mode,
    verification_status: "pending",
    generated_at: generatedAt,
    file_name: fileName,
    storage_path: remotePath,
    archive_version: MARKET_ARCHIVE_VERSION,
    retention_years: resolveMarketArchiveRetentionYears(),
  });
  let digest: MarketArchiveDigest | undefined;

  try {
    const payload = await buildMarketArchivePayload(supabase, generatedAt);
    const archiveBuffer = compressMarketArchivePayload(
      serializeMarketArchivePayload(payload),
    );
    digest = buildMarketArchiveDigest(archiveBuffer);

    let localPath: string | undefined;
    let storedBuffer: Buffer;

    if (target.mode === "local") {
      const localArtifact = await uploadArchiveToLocalTarget(
        target,
        remotePath,
        archiveBuffer,
      );
      localPath = localArtifact.localPath;
      storedBuffer = localArtifact.storedBuffer;
    } else {
      storedBuffer = await uploadArchiveToSftpTarget(target, remotePath, archiveBuffer);
    }

    const verification = verifyMarketArchiveArtifact(
      storedBuffer,
      digest,
      generatedAt,
    );
    const result: MarketArchiveResult = {
      ok: true,
      mode: target.mode,
      runId,
      generatedAt,
      fileName,
      remotePath: target.mode === "sftp" ? remotePath : undefined,
      localPath,
      sha256: digest.sha256,
      byteLength: digest.byteLength,
      verificationStatus: verification.status,
      verifiedAt: verification.verifiedAt,
      summary: {
        organizations: payload.metadata.organizationCount,
        projects: payload.metadata.projectCount,
        documents: payload.metadata.documentCount,
        signatures: payload.metadata.signatureCount,
        situations: payload.metadata.situationCount,
        followups: payload.metadata.followupCount,
        consultingMissions: payload.metadata.consultingMissionCount,
        technicalReviews: payload.metadata.technicalReviewCount,
      },
    };

    await markArchiveRunSucceeded(supabase, runId, result);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "market_archive_failed";

    try {
      await markArchiveRunFailed(supabase, runId, errorMessage, digest);
    } catch (journalError) {
      throw new AggregateError(
        [error, journalError],
        "L'archivage et sa journalisation ont echoue.",
      );
    }

    throw error;
  }
}
