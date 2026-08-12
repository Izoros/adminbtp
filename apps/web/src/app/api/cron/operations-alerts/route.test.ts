import { beforeEach, describe, expect, it, vi } from "vitest";

const { runOperationsAlertScan } = vi.hoisted(() => ({
  runOperationsAlertScan: vi.fn(),
}));
const { runOperationsRetentionCleanup } = vi.hoisted(() => ({
  runOperationsRetentionCleanup: vi.fn(),
}));

vi.mock("@/modules/archival/services/operations-alerts", () => ({
  runOperationsAlertScan,
}));

vi.mock("@/modules/archival/services/operations-retention", () => ({
  runOperationsRetentionCleanup,
}));

import { GET } from "@/app/api/cron/operations-alerts/route";

describe("route cron des alertes d exploitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "cron-secret-test");
    runOperationsRetentionCleanup.mockResolvedValue({
      purgedAt: "2026-08-12T04:00:00.000Z",
      deletedWhatsAppCommands: 0,
      deletedOperationsAlerts: 0,
    });
  });

  it("refuse un appel sans secret cron", async () => {
    const response = await GET(
      new Request("https://adminbtp.vercel.app/api/cron/operations-alerts") as never,
    );

    expect(response.status).toBe(401);
    expect(runOperationsAlertScan).not.toHaveBeenCalled();
    expect(runOperationsRetentionCleanup).not.toHaveBeenCalled();
  });

  it("retourne le resultat desactive sans contacter un canal externe", async () => {
    runOperationsAlertScan.mockResolvedValue({
      ok: true,
      mode: "disabled",
      evaluated: 0,
      delivered: 0,
      deduplicated: 0,
      failed: 0,
      skippedReason: "Alertes desactivees.",
    });
    const response = await GET(
      new Request("https://adminbtp.vercel.app/api/cron/operations-alerts", {
        headers: { authorization: "Bearer cron-secret-test" },
      }) as never,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      mode: "disabled",
      retention: {
        deletedWhatsAppCommands: 0,
        deletedOperationsAlerts: 0,
      },
    });
  });

  it("rend un echec d envoi visible au scheduler", async () => {
    runOperationsAlertScan.mockResolvedValue({
      ok: false,
      mode: "active",
      evaluated: 1,
      delivered: 0,
      deduplicated: 0,
      failed: 1,
    });
    const response = await GET(
      new Request("https://adminbtp.vercel.app/api/cron/operations-alerts", {
        headers: { authorization: "Bearer cron-secret-test" },
      }) as never,
    );

    expect(response.status).toBe(502);
  });
});
