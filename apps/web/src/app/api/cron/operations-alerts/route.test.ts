import { beforeEach, describe, expect, it, vi } from "vitest";

const { runOperationsAlertScan } = vi.hoisted(() => ({
  runOperationsAlertScan: vi.fn(),
}));

vi.mock("@/modules/archival/services/operations-alerts", () => ({
  runOperationsAlertScan,
}));

import { GET } from "@/app/api/cron/operations-alerts/route";

describe("route cron des alertes d exploitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "cron-secret-test");
  });

  it("refuse un appel sans secret cron", async () => {
    const response = await GET(
      new Request("https://adminbtp.vercel.app/api/cron/operations-alerts") as never,
    );

    expect(response.status).toBe(401);
    expect(runOperationsAlertScan).not.toHaveBeenCalled();
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
