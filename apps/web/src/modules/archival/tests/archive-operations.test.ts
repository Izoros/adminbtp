import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  createSessionClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: serviceMocks.createSessionClient,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: serviceMocks.createAdminClient,
}));

import {
  buildArchiveOperationsData,
  loadArchiveOperationsData,
} from "@/modules/archival/services/archive-operations";
import type { SupabaseDatabase } from "@/types/supabase";

type ArchiveRunRow = SupabaseDatabase["public"]["Tables"]["archive_runs"]["Row"];

function buildArchiveRunRow(overrides: Partial<ArchiveRunRow> = {}): ArchiveRunRow {
  return {
    id: "archive_run_1",
    status: "succeeded",
    storage_mode: "sftp",
    verification_status: "verified",
    generated_at: "2026-08-12T00:00:00.000Z",
    started_at: "2026-08-12T00:00:00.000Z",
    completed_at: "2026-08-12T00:01:00.000Z",
    verified_at: "2026-08-12T00:01:00.000Z",
    file_name: "market-archive-2026-08-12.json.gz",
    storage_path: "/adminbtp/archives/2026/08/12/archive.json.gz",
    sha256: "a".repeat(64),
    byte_length: 1_024,
    archive_version: 1,
    retention_years: 25,
    summary: {},
    error_message: null,
    created_at: "2026-08-12T00:00:00.000Z",
    ...overrides,
  };
}

function buildSessionClient(options?: {
  authenticated?: boolean;
  platformAdmin?: boolean;
  roleError?: boolean;
}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue(
        options?.authenticated === false
          ? { data: { user: null }, error: null }
          : { data: { user: { id: "user_1" } }, error: null },
      ),
    },
    rpc: vi.fn().mockResolvedValue(
      options?.roleError
        ? { data: null, error: { message: "role unavailable" } }
        : { data: options?.platformAdmin ?? true, error: null },
    ),
  };
}

function buildAdminClient(rows: ArchiveRunRow[]) {
  const limit = vi.fn().mockResolvedValue({ data: rows, error: null });
  const order = vi.fn().mockReturnValue({ limit });
  const select = vi.fn().mockReturnValue({ order });

  return {
    client: { from: vi.fn().mockReturnValue({ select }) },
    limit,
  };
}

describe("archive-operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("declare l archivage sain apres une archive quotidienne verifiee", () => {
    const data = buildArchiveOperationsData(
      [buildArchiveRunRow()],
      new Date("2026-08-12T03:00:00.000Z"),
    );

    expect(data).toMatchObject({
      health: "healthy",
      totalRuns: 1,
      succeededRuns: 1,
      failedRuns: 0,
      stalledRuns: 0,
    });
  });

  it("conserve un etat vide honnete sans historique", () => {
    const data = buildArchiveOperationsData(
      [],
      new Date("2026-08-12T03:00:00.000Z"),
    );

    expect(data).toMatchObject({
      health: "empty",
      totalRuns: 0,
      lastSucceededAt: null,
      runs: [],
    });
  });

  it("signale une archive quotidienne en retard", () => {
    const data = buildArchiveOperationsData(
      [buildArchiveRunRow({ generated_at: "2026-08-10T00:00:00.000Z" })],
      new Date("2026-08-12T03:00:00.000Z"),
    );

    expect(data.health).toBe("attention");
    expect(data.healthLabel).toMatch(/retard/i);
  });

  it("signale un echec recent et une execution bloquee", () => {
    const failedData = buildArchiveOperationsData(
      [
        buildArchiveRunRow({
          status: "failed",
          verification_status: "failed",
          error_message: "SFTP indisponible",
        }),
      ],
      new Date("2026-08-12T03:00:00.000Z"),
    );
    const stalledData = buildArchiveOperationsData(
      [
        buildArchiveRunRow({
          status: "running",
          verification_status: "pending",
          started_at: "2026-08-12T02:30:00.000Z",
          completed_at: null,
          verified_at: null,
        }),
      ],
      new Date("2026-08-12T03:00:00.000Z"),
    );

    expect(failedData.health).toBe("critical");
    expect(stalledData.health).toBe("critical");
    expect(stalledData.stalledRuns).toBe(1);
  });

  it("n ouvre jamais le client service role pour un utilisateur non admin", async () => {
    serviceMocks.createSessionClient.mockResolvedValue(
      buildSessionClient({ platformAdmin: false }),
    );

    await expect(loadArchiveOperationsData()).resolves.toMatchObject({
      access: "forbidden",
    });
    expect(serviceMocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("charge au plus 50 executions apres verification du role plateforme", async () => {
    const adminClient = buildAdminClient([buildArchiveRunRow()]);
    serviceMocks.createSessionClient.mockResolvedValue(buildSessionClient());
    serviceMocks.createAdminClient.mockReturnValue(adminClient.client);

    const result = await loadArchiveOperationsData();

    expect(result).toMatchObject({
      access: "ready",
      data: {
        totalRuns: 1,
      },
    });
    expect(adminClient.client.from).toHaveBeenCalledWith("archive_runs");
    expect(adminClient.limit).toHaveBeenCalledWith(50);
  });

  it("refuse une session absente avant toute verification privilegiee", async () => {
    serviceMocks.createSessionClient.mockResolvedValue(
      buildSessionClient({ authenticated: false }),
    );

    await expect(loadArchiveOperationsData()).resolves.toMatchObject({
      access: "unauthenticated",
    });
    expect(serviceMocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("rend l indisponibilite explicite si le lecteur serveur manque", async () => {
    serviceMocks.createSessionClient.mockResolvedValue(buildSessionClient());
    serviceMocks.createAdminClient.mockReturnValue(null);

    await expect(loadArchiveOperationsData()).resolves.toMatchObject({
      access: "unavailable",
      message: expect.stringMatching(/lecteur serveur/i),
    });
  });
});
