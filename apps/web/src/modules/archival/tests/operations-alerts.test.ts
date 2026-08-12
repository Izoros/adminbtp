import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildArchiveAlertCandidates,
  resolveOperationsAlertConfig,
  runOperationsAlertScan,
} from "@/modules/archival/services/operations-alerts";
import type { SupabaseDatabase } from "@/types/supabase";

type ArchiveRunRow = SupabaseDatabase["public"]["Tables"]["archive_runs"]["Row"];
type OperationsAlertRow =
  SupabaseDatabase["public"]["Tables"]["operations_alerts"]["Row"];

function buildArchiveRunRow(overrides: Partial<ArchiveRunRow> = {}): ArchiveRunRow {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    status: "succeeded",
    storage_mode: "sftp",
    verification_status: "verified",
    generated_at: "2026-08-12T03:00:00.000Z",
    started_at: "2026-08-12T03:00:00.000Z",
    completed_at: "2026-08-12T03:01:00.000Z",
    verified_at: "2026-08-12T03:01:00.000Z",
    file_name: "archive.json.gz",
    storage_path: "/private/archive.json.gz",
    sha256: "a".repeat(64),
    byte_length: 1_024,
    archive_version: 1,
    retention_years: 25,
    summary: {},
    error_message: null,
    created_at: "2026-08-12T03:00:00.000Z",
    ...overrides,
  };
}

function buildClaimedAlert(): OperationsAlertRow {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    fingerprint: "archive_failed:11111111-1111-4111-8111-111111111111",
    alert_kind: "archive_failed",
    severity: "high",
    title: "Une archive AdminBTP a echoue",
    source_entity_id: "11111111-1111-4111-8111-111111111111",
    occurred_at: "2026-08-12T03:01:00.000Z",
    retention_until: "2027-08-12T03:01:00.000Z",
    status: "dispatching",
    attempts: 1,
    last_attempt_at: "2026-08-12T04:00:00.000Z",
    delivered_at: null,
    last_error: null,
    created_at: "2026-08-12T04:00:00.000Z",
    updated_at: "2026-08-12T04:00:00.000Z",
  };
}

function buildAdminClient(rows: ArchiveRunRow[], claimedRows = [buildClaimedAlert()]) {
  const limit = vi.fn().mockResolvedValue({ data: rows, error: null });
  const order = vi.fn().mockReturnValue({ limit });
  const select = vi.fn().mockReturnValue({ order });
  const eq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn().mockReturnValue({ eq });
  const rpc = vi.fn().mockResolvedValue({ data: claimedRows, error: null });

  return {
    client: {
      from: vi.fn().mockImplementation((tableName: string) =>
        tableName === "archive_runs" ? { select } : { update },
      ),
      rpc,
    },
    rpc,
    update,
  };
}

describe("alertes d exploitation des archives", () => {
  beforeEach(() => {
    vi.stubEnv("ADMINBTP_OPERATIONS_ALERTS_ENABLED", "true");
    vi.stubEnv(
      "ADMINBTP_OPERATIONS_ALERT_WEBHOOK_URL",
      "https://alerts.example.com/adminbtp",
    );
    vi.stubEnv("ADMINBTP_OPERATIONS_ALERT_WEBHOOK_TOKEN", "alert-token-test");
    vi.stubEnv("ADMINBTP_OPERATIONS_ALERT_ALLOWED_HOSTS", "alerts.example.com");
    vi.stubEnv("MARKET_ARCHIVE_ENABLED", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("detecte echec, blocage et retard sans exporter les metadonnees d archive", () => {
    const candidates = buildArchiveAlertCandidates(
      [
        buildArchiveRunRow({
          status: "failed",
          verification_status: "failed",
          error_message: "mot de passe distant invalide",
        }),
        buildArchiveRunRow({
          id: "33333333-3333-4333-8333-333333333333",
          status: "running",
          verification_status: "pending",
          generated_at: "2026-08-12T03:30:00.000Z",
          started_at: "2026-08-12T03:30:00.000Z",
          completed_at: null,
          verified_at: null,
        }),
      ],
      new Date("2026-08-12T04:00:00.000Z"),
    );

    expect(candidates.map((candidate) => candidate.kind)).toEqual([
      "archive_failed",
      "archive_stalled",
      "archive_overdue",
    ]);
    expect(JSON.stringify(candidates)).not.toContain("mot de passe");
    expect(JSON.stringify(candidates)).not.toContain("/private/");
  });

  it("ne cree aucune alerte quand une archive recente est saine", () => {
    expect(
      buildArchiveAlertCandidates(
        [buildArchiveRunRow()],
        new Date("2026-08-12T04:00:00.000Z"),
      ),
    ).toEqual([]);
  });

  it("refuse les destinations non HTTPS, privees ou hors liste blanche", () => {
    vi.stubEnv("ADMINBTP_OPERATIONS_ALERT_WEBHOOK_URL", "http://127.0.0.1/hook");
    vi.stubEnv("ADMINBTP_OPERATIONS_ALERT_ALLOWED_HOSTS", "127.0.0.1");

    expect(resolveOperationsAlertConfig()).toMatchObject({ mode: "invalid" });

    vi.stubEnv(
      "ADMINBTP_OPERATIONS_ALERT_WEBHOOK_URL",
      "https://other.example.com/hook",
    );
    vi.stubEnv("ADMINBTP_OPERATIONS_ALERT_ALLOWED_HOSTS", "alerts.example.com");

    expect(resolveOperationsAlertConfig()).toMatchObject({ mode: "invalid" });
  });

  it("livre une alerte reservee et ne transmet que le contrat minimal", async () => {
    const healthyRun = buildArchiveRunRow();
    const failedRun = buildArchiveRunRow({
      status: "failed",
      verification_status: "failed",
      error_message: "secret distant",
    });
    const adminClient = buildAdminClient([failedRun, healthyRun]);
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

    const result = await runOperationsAlertScan({
      adminClient: adminClient.client as never,
      fetcher,
      now: new Date("2026-08-12T04:00:00.000Z"),
    });

    expect(result).toMatchObject({
      ok: true,
      evaluated: 1,
      delivered: 1,
      failed: 0,
    });
    expect(adminClient.rpc).toHaveBeenCalledWith(
      "claim_operations_alert",
      expect.objectContaining({ target_alert_kind: "archive_failed" }),
    );
    const requestBody = String(fetcher.mock.calls[0][1]?.body);
    expect(requestBody).not.toContain("secret distant");
    expect(requestBody).not.toContain("/private/");
    expect(adminClient.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "delivered" }),
    );
  });

  it("n appelle aucun service externe quand les alertes sont desactivees", async () => {
    vi.stubEnv("ADMINBTP_OPERATIONS_ALERTS_ENABLED", "false");
    const fetcher = vi.fn();

    await expect(runOperationsAlertScan({ fetcher })).resolves.toMatchObject({
      ok: true,
      mode: "disabled",
      evaluated: 0,
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("deduplique une alerte deja livree ou en cours", async () => {
    const adminClient = buildAdminClient(
      [
        buildArchiveRunRow({
          status: "failed",
          verification_status: "failed",
        }),
        buildArchiveRunRow({
          id: "44444444-4444-4444-8444-444444444444",
        }),
      ],
      [],
    );
    const fetcher = vi.fn();

    await expect(
      runOperationsAlertScan({
        adminClient: adminClient.client as never,
        fetcher,
        now: new Date("2026-08-12T04:00:00.000Z"),
      }),
    ).resolves.toMatchObject({
      evaluated: 1,
      delivered: 0,
      deduplicated: 1,
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
