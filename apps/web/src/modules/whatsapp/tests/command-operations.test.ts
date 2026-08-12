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
  buildWhatsAppCommandQueueData,
  loadWhatsAppCommandQueue,
} from "@/modules/whatsapp/services/command-operations";
import type { SupabaseDatabase } from "@/types/supabase";

type WhatsAppCommandRow =
  SupabaseDatabase["public"]["Tables"]["whatsapp_command_requests"]["Row"];

function buildRow(overrides: Partial<WhatsAppCommandRow> = {}): WhatsAppCommandRow {
  return {
    id: "command_1",
    provider_message_id: "wamid.command.1",
    business_phone_number_id: "phone_business_1",
    sender_fingerprint: "a".repeat(64),
    command_text: "Continue le developpement",
    command_kind: "development_request",
    status: "pending_review",
    provider_sent_at: "2026-08-12T08:00:00.000Z",
    received_at: "2026-08-12T08:00:01.000Z",
    reviewed_at: null,
    reviewed_by: null,
    completed_at: null,
    response_summary: null,
    retention_until: "2026-11-10T08:00:01.000Z",
    created_at: "2026-08-12T08:00:01.000Z",
    updated_at: "2026-08-12T08:00:01.000Z",
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

function buildAdminClient(rows: WhatsAppCommandRow[]) {
  const limit = vi.fn().mockResolvedValue({ data: rows, error: null });
  const order = vi.fn().mockReturnValue({ limit });
  const select = vi.fn().mockReturnValue({ order });

  return {
    client: { from: vi.fn().mockReturnValue({ select }) },
    limit,
  };
}

describe("supervision des commandes WhatsApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resume la file par statut", () => {
    const data = buildWhatsAppCommandQueueData([
      buildRow(),
      buildRow({ id: "command_2", status: "completed" }),
      buildRow({ id: "command_3", status: "failed" }),
    ]);

    expect(data).toMatchObject({
      totalCommands: 3,
      pendingCommands: 1,
      completedCommands: 1,
      failedCommands: 1,
    });
  });

  it("refuse le service role a un utilisateur non administrateur plateforme", async () => {
    serviceMocks.createSessionClient.mockResolvedValue(
      buildSessionClient({ platformAdmin: false }),
    );

    await expect(loadWhatsAppCommandQueue()).resolves.toMatchObject({
      access: "forbidden",
    });
    expect(serviceMocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("charge au plus 100 demandes apres autorisation", async () => {
    const adminClient = buildAdminClient([buildRow()]);
    serviceMocks.createSessionClient.mockResolvedValue(buildSessionClient());
    serviceMocks.createAdminClient.mockReturnValue(adminClient.client);

    await expect(loadWhatsAppCommandQueue()).resolves.toMatchObject({
      access: "ready",
      data: { totalCommands: 1 },
    });
    expect(adminClient.client.from).toHaveBeenCalledWith(
      "whatsapp_command_requests",
    );
    expect(adminClient.limit).toHaveBeenCalledWith(100);
  });

  it("refuse une session absente avant toute lecture privilegiee", async () => {
    serviceMocks.createSessionClient.mockResolvedValue(
      buildSessionClient({ authenticated: false }),
    );

    await expect(loadWhatsAppCommandQueue()).resolves.toMatchObject({
      access: "unauthenticated",
    });
    expect(serviceMocks.createAdminClient).not.toHaveBeenCalled();
  });
});
