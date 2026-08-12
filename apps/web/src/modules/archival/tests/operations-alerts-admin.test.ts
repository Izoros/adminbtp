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
  buildOperationsAlertsData,
  loadOperationsAlertsData,
} from "@/modules/archival/services/operations-alerts-admin";
import type { SupabaseDatabase } from "@/types/supabase";

type OperationsAlertRow =
  SupabaseDatabase["public"]["Tables"]["operations_alerts"]["Row"];

function buildRow(overrides: Partial<OperationsAlertRow> = {}): OperationsAlertRow {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    fingerprint: "archive_failed:11111111-1111-4111-8111-111111111111",
    alert_kind: "archive_failed",
    severity: "high",
    title: "Une archive AdminBTP a echoue",
    source_entity_id: "11111111-1111-4111-8111-111111111111",
    occurred_at: "2026-08-12T03:01:00.000Z",
    status: "delivered",
    attempts: 1,
    last_attempt_at: "2026-08-12T04:00:00.000Z",
    delivered_at: "2026-08-12T04:00:01.000Z",
    last_error: null,
    created_at: "2026-08-12T04:00:00.000Z",
    updated_at: "2026-08-12T04:00:01.000Z",
    ...overrides,
  };
}

function buildSessionClient(options?: {
  authenticated?: boolean;
  platformAdmin?: boolean;
}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue(
        options?.authenticated === false
          ? { data: { user: null }, error: null }
          : { data: { user: { id: "user_1" } }, error: null },
      ),
    },
    rpc: vi.fn().mockResolvedValue({
      data: options?.platformAdmin ?? true,
      error: null,
    }),
  };
}

function buildAdminClient(rows: OperationsAlertRow[]) {
  const limit = vi.fn().mockResolvedValue({ data: rows, error: null });
  const order = vi.fn().mockReturnValue({ limit });
  const select = vi.fn().mockReturnValue({ order });

  return {
    client: { from: vi.fn().mockReturnValue({ select }) },
    limit,
  };
}

describe("supervision des alertes d exploitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resume les livraisons par statut", () => {
    const data = buildOperationsAlertsData([
      buildRow(),
      buildRow({ id: "alert_2", status: "failed" }),
      buildRow({ id: "alert_3", status: "dispatching" }),
    ]);

    expect(data).toMatchObject({
      totalAlerts: 3,
      deliveredAlerts: 1,
      failedAlerts: 1,
      activeAlerts: 1,
    });
  });

  it("refuse toute lecture privilegiee a un non administrateur", async () => {
    serviceMocks.createSessionClient.mockResolvedValue(
      buildSessionClient({ platformAdmin: false }),
    );

    await expect(loadOperationsAlertsData()).resolves.toMatchObject({
      access: "forbidden",
    });
    expect(serviceMocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("charge au plus 100 alertes apres autorisation", async () => {
    const adminClient = buildAdminClient([buildRow()]);
    serviceMocks.createSessionClient.mockResolvedValue(buildSessionClient());
    serviceMocks.createAdminClient.mockReturnValue(adminClient.client);

    await expect(loadOperationsAlertsData()).resolves.toMatchObject({
      access: "ready",
      data: { totalAlerts: 1 },
    });
    expect(adminClient.client.from).toHaveBeenCalledWith("operations_alerts");
    expect(adminClient.limit).toHaveBeenCalledWith(100);
  });
});
