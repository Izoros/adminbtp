import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

import SftpClient from "ssh2-sftp-client";
import { createClient } from "@supabase/supabase-js";

import type { SupabaseDatabase } from "@/types/supabase";
import type {
  MarketArchiveDigest,
  MarketArchivePayload,
  MarketArchiveResult,
  MarketArchiveStorageTarget,
} from "@/modules/archival/types/archival";

type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;
type OrganizationArchiveRow = SupabaseDatabase["public"]["Tables"]["organizations"]["Row"];

const DEFAULT_RETENTION_YEARS = 25;
const DEFAULT_REMOTE_BASE_PATH = "/adminbtp/archives";
const DEFAULT_LOCAL_ARCHIVE_DIR = ".archives/market-archive";

function readRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

function createSupabaseAdminClient() {
  const supabaseUrl = readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient<SupabaseDatabase>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
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

async function uploadArchiveToLocalTarget(
  target: Extract<MarketArchiveStorageTarget, { mode: "local" }>,
  remotePath: string,
  archiveBuffer: Buffer,
) {
  const localPath = join(target.localDirectory, remotePath.replace(/^\/+/, ""));
  await mkdir(join(localPath, ".."), { recursive: true });
  await writeFile(localPath, archiveBuffer);
  return localPath;
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
  } finally {
    await sftp.end().catch(() => undefined);
  }
}

async function fetchArchiveRows(
  supabase: NonNullable<SupabaseAdminClient>,
  tableName: keyof SupabaseDatabase["public"]["Tables"],
  columns = "*",
) {
  const { data, error } = await supabase.from(tableName).select(columns);

  if (error) {
    throw new Error(`Lecture impossible pour ${String(tableName)}: ${error.message}`);
  }

  return ((data ?? []) as unknown) as Record<string, unknown>[];
}

export async function buildMarketArchivePayload(): Promise<MarketArchivePayload> {
  const supabase = createSupabaseAdminClient();

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
      archiveVersion: 1,
      generatedAt: new Date().toISOString(),
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

  const payload = await buildMarketArchivePayload();
  const archiveBuffer = compressMarketArchivePayload(
    serializeMarketArchivePayload(payload),
  );
  const digest = buildMarketArchiveDigest(archiveBuffer);
  const remotePath = buildMarketArchiveRemotePath(
    generatedAt,
    fileName,
    target.mode === "local" ? DEFAULT_LOCAL_ARCHIVE_DIR : target.remoteBasePath,
  );

  let localPath: string | undefined;

  if (target.mode === "local") {
    localPath = await uploadArchiveToLocalTarget(target, remotePath, archiveBuffer);
  } else {
    await uploadArchiveToSftpTarget(target, remotePath, archiveBuffer);
  }

  return {
    ok: true,
    mode: target.mode,
    generatedAt,
    fileName,
    remotePath: target.mode === "sftp" ? remotePath : undefined,
    localPath,
    sha256: digest.sha256,
    byteLength: digest.byteLength,
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
}
