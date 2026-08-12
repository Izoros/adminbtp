import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseAdminClient } = vi.hoisted(() => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient,
}));

import { enqueueWhatsAppCommand } from "@/modules/whatsapp/services/command-queue";
import type { WhatsAppCommandCandidate } from "@/modules/whatsapp/types/command";

const candidate: WhatsAppCommandCandidate = {
  providerMessageId: "wamid.command.1",
  businessPhoneNumberId: "phone_business_1",
  senderPhone: "+262690000000",
  commandText: "Continue le developpement",
  commandKind: "development_request",
  providerSentAt: "2026-08-12T08:00:00.000Z",
};

function buildAdminClient(result: {
  data: { id: string } | null;
  error: { code: string } | null;
}) {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });

  return {
    client: { from: vi.fn().mockReturnValue({ insert }) },
    insert,
  };
}

describe("file de commandes WhatsApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ne persiste jamais si le client service role est absent", async () => {
    createSupabaseAdminClient.mockReturnValue(null);

    await expect(
      enqueueWhatsAppCommand(candidate, "a".repeat(64)),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("persiste uniquement l empreinte et le texte normalise", async () => {
    const adminClient = buildAdminClient({
      data: { id: "command_1" },
      error: null,
    });
    createSupabaseAdminClient.mockReturnValue(adminClient.client);

    await expect(
      enqueueWhatsAppCommand(candidate, "a".repeat(64)),
    ).resolves.toEqual({ status: "persisted", commandId: "command_1" });
    expect(adminClient.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        provider_message_id: "wamid.command.1",
        sender_fingerprint: "a".repeat(64),
        command_text: "Continue le developpement",
        status: "pending_review",
      }),
    );
    expect(JSON.stringify(adminClient.insert.mock.calls[0])).not.toContain(
      "+262690000000",
    );
  });

  it("traite la contrainte unique comme un doublon idempotent", async () => {
    const adminClient = buildAdminClient({
      data: null,
      error: { code: "23505" },
    });
    createSupabaseAdminClient.mockReturnValue(adminClient.client);

    await expect(
      enqueueWhatsAppCommand(candidate, "a".repeat(64)),
    ).resolves.toEqual({ status: "duplicate" });
  });
});
