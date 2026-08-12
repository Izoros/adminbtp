import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: serviceMocks.createClient,
}));

import {
  buildIntegrationReadinessData,
  loadIntegrationReadiness,
} from "@/modules/settings/services/integration-readiness";

function buildSessionClient(options?: {
  authenticated?: boolean;
  platformAdmin?: boolean;
  roleCheckError?: boolean;
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
      error: options?.roleCheckError ? new Error("role unavailable") : null,
    }),
  };
}

describe("preparation des integrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("distingue les integrations inactives d une configuration obligatoire manquante", () => {
    const data = buildIntegrationReadinessData(
      {},
      new Date("2026-08-12T05:00:00.000Z"),
    );

    expect(data).toMatchObject({
      updatedAt: "2026-08-12T05:00:00.000Z",
      readyGroups: 0,
      totalGroups: 4,
    });
    expect(data.groups.find((group) => group.id === "supabase")?.status).toBe(
      "attention",
    );
    expect(data.groups.find((group) => group.id === "whatsapp")?.status).toBe(
      "inactive",
    );
    expect(data.groups.find((group) => group.id === "archive")?.status).toBe(
      "inactive",
    );
    expect(data.groups.find((group) => group.id === "alerts")?.status).toBe(
      "inactive",
    );
  });

  it("confirme une configuration complete sans restituer les valeurs sensibles", () => {
    const environment = {
      NEXT_PUBLIC_SUPABASE_URL: "https://private-project.invalid",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-key-unique",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-secret-unique",
      ADMINBTP_WHATSAPP_COMMANDS_ENABLED: "true",
      ADMINBTP_WHATSAPP_WEBHOOK_VERIFY_TOKEN: "verify-token-unique",
      ADMINBTP_WHATSAPP_APP_SECRET: "meta-secret-unique",
      ADMINBTP_WHATSAPP_ALLOWED_SENDERS: "+262639000001,+262639000002",
      MARKET_ARCHIVE_ENABLED: "true",
      CRON_SECRET: "cron-secret-unique",
      MARKET_ARCHIVE_SFTP_HOST: "archive.private.invalid",
      MARKET_ARCHIVE_SFTP_USERNAME: "archive-user-unique",
      ADMINBTP_OPERATIONS_ALERTS_ENABLED: "true",
      ADMINBTP_OPERATIONS_ALERT_WEBHOOK_URL:
        "https://alerts.private.invalid/adminbtp",
      ADMINBTP_OPERATIONS_ALERT_WEBHOOK_TOKEN: "alert-secret-unique",
      ADMINBTP_OPERATIONS_ALERT_ALLOWED_HOSTS: "alerts.private.invalid",
    };

    const data = buildIntegrationReadinessData(environment);
    const serialized = JSON.stringify(data);

    expect(data.readyGroups).toBe(4);
    expect(data.groups.every((group) => group.status === "ready")).toBe(true);
    const valuesThatMustRemainServerOnly = [
      environment.NEXT_PUBLIC_SUPABASE_URL,
      environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      environment.SUPABASE_SERVICE_ROLE_KEY,
      environment.ADMINBTP_WHATSAPP_WEBHOOK_VERIFY_TOKEN,
      environment.ADMINBTP_WHATSAPP_APP_SECRET,
      environment.ADMINBTP_WHATSAPP_ALLOWED_SENDERS,
      environment.CRON_SECRET,
      environment.MARKET_ARCHIVE_SFTP_HOST,
      environment.MARKET_ARCHIVE_SFTP_USERNAME,
      environment.ADMINBTP_OPERATIONS_ALERT_WEBHOOK_URL,
      environment.ADMINBTP_OPERATIONS_ALERT_WEBHOOK_TOKEN,
      environment.ADMINBTP_OPERATIONS_ALERT_ALLOWED_HOSTS,
    ];

    for (const secretValue of valuesThatMustRemainServerOnly) {
      expect(serialized).not.toContain(secretValue);
    }
    expect(serialized).toContain("2 expediteur(s) configure(s)");
  });

  it("refuse la lecture a un utilisateur non plateforme", async () => {
    serviceMocks.createClient.mockResolvedValue(
      buildSessionClient({ platformAdmin: false }),
    );

    await expect(loadIntegrationReadiness()).resolves.toMatchObject({
      access: "forbidden",
    });
  });

  it("retourne la preparation apres authentification plateforme", async () => {
    serviceMocks.createClient.mockResolvedValue(buildSessionClient());

    await expect(loadIntegrationReadiness()).resolves.toMatchObject({
      access: "ready",
      data: { totalGroups: 4 },
    });
  });
});
