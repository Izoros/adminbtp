import { describe, expect, it, vi } from "vitest";

import {
  parseOperationsRetentionResult,
  runOperationsRetentionCleanup,
} from "@/modules/archival/services/operations-retention";

describe("retention des donnees d exploitation", () => {
  it("normalise les compteurs retournes par PostgreSQL", () => {
    expect(
      parseOperationsRetentionResult(
        {
          purged_at: "2026-08-12T04:00:00.000Z",
          deleted_whatsapp_commands: 3,
          deleted_operations_alerts: 2,
        },
        "fallback",
      ),
    ).toEqual({
      purgedAt: "2026-08-12T04:00:00.000Z",
      deletedWhatsAppCommands: 3,
      deletedOperationsAlerts: 2,
    });
  });

  it("appelle uniquement la fonction de purge avec une date explicite", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        purged_at: "2026-08-12T04:00:00.000Z",
        deleted_whatsapp_commands: 1,
        deleted_operations_alerts: 0,
      },
      error: null,
    });

    await expect(
      runOperationsRetentionCleanup({
        now: new Date("2026-08-12T04:00:00.000Z"),
        adminClient: { rpc } as never,
      }),
    ).resolves.toMatchObject({
      deletedWhatsAppCommands: 1,
      deletedOperationsAlerts: 0,
    });
    expect(rpc).toHaveBeenCalledWith("purge_expired_operations_data", {
      target_now: "2026-08-12T04:00:00.000Z",
    });
  });

  it("rend une erreur SQL visible au cron", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "function missing" },
    });

    await expect(
      runOperationsRetentionCleanup({ adminClient: { rpc } as never }),
    ).rejects.toThrow(/purge/i);
  });
});
