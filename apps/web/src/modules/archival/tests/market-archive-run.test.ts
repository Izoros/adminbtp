import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  from: vi.fn(),
  insert: vi.fn(),
  selectInserted: vi.fn(),
  single: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: supabaseMocks.createClient,
}));

import {
  restoreMarketArchivePayload,
  runMarketArchiveBackup,
} from "@/modules/archival/services/market-archive";

describe("market-archive-run", () => {
  const temporaryDirectories: string[] = [];
  let failingTable: string | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    failingTable = null;

    supabaseMocks.single.mockResolvedValue({
      data: { id: "archive_run_1" },
      error: null,
    });
    supabaseMocks.eq.mockResolvedValue({ error: null });
    supabaseMocks.selectInserted.mockReturnValue({ single: supabaseMocks.single });
    supabaseMocks.insert.mockReturnValue({ select: supabaseMocks.selectInserted });
    supabaseMocks.update.mockReturnValue({ eq: supabaseMocks.eq });
    supabaseMocks.from.mockImplementation((tableName: string) => {
      if (tableName === "archive_runs") {
        return {
          insert: supabaseMocks.insert,
          update: supabaseMocks.update,
        };
      }

      return {
        select: vi.fn().mockResolvedValue(
          tableName === failingTable
            ? { data: null, error: { message: "lecture simulee impossible" } }
            : { data: [], error: null },
        ),
      };
    });
    supabaseMocks.createClient.mockReturnValue({ from: supabaseMocks.from });

    vi.stubEnv("MARKET_ARCHIVE_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-test");
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await Promise.all(
      temporaryDirectories.splice(0).map((directory) =>
        rm(directory, { recursive: true, force: true }),
      ),
    );
  });

  it("journalise puis verifie une archive locale relue", async () => {
    const localDirectory = await mkdtemp(join(tmpdir(), "adminbtp-archive-"));
    temporaryDirectories.push(localDirectory);
    vi.stubEnv("MARKET_ARCHIVE_LOCAL_DIR", localDirectory);

    const result = await runMarketArchiveBackup();

    expect(result).toMatchObject({
      ok: true,
      mode: "local",
      runId: "archive_run_1",
      verificationStatus: "verified",
    });
    expect(result.sha256).toHaveLength(64);
    expect(supabaseMocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "running",
        storage_mode: "local",
        verification_status: "pending",
      }),
    );
    expect(supabaseMocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "succeeded",
        verification_status: "verified",
        sha256: result.sha256,
      }),
    );
    expect(supabaseMocks.eq).toHaveBeenCalledWith("id", "archive_run_1");

    if (!result.localPath) {
      throw new Error("Le chemin local de test est absent.");
    }

    expect(result.localPath).toContain(join(localDirectory, "market-archive"));
    const restoredPayload = restoreMarketArchivePayload(await readFile(result.localPath));
    expect(restoredPayload.metadata.generatedAt).toBe(result.generatedAt);
  });

  it("journalise l echec d une lecture metier", async () => {
    const localDirectory = await mkdtemp(join(tmpdir(), "adminbtp-archive-"));
    temporaryDirectories.push(localDirectory);
    vi.stubEnv("MARKET_ARCHIVE_LOCAL_DIR", localDirectory);
    failingTable = "projects";

    await expect(runMarketArchiveBackup()).rejects.toThrow(
      "Lecture impossible pour projects: lecture simulee impossible",
    );
    expect(supabaseMocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        verification_status: "failed",
        error_message: "Lecture impossible pour projects: lecture simulee impossible",
      }),
    );
    expect(supabaseMocks.eq).toHaveBeenCalledWith("id", "archive_run_1");
  });
});
