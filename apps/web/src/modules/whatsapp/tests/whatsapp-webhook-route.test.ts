import { createHmac } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

const enqueueWhatsAppCommand = vi.fn();

vi.mock("@/modules/whatsapp/services/command-queue", () => ({
  enqueueWhatsAppCommand,
}));

const APP_SECRET = "meta-app-secret-test";

function buildPayload(options?: { sender?: string; body?: string }) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: "phone_business_1" },
              messages: [
                {
                  from: options?.sender ?? "262690000000",
                  id: "wamid.command.1",
                  timestamp: "1786500000",
                  type: "text",
                  text: { body: options?.body ?? "Continue la phase suivante" },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

function createSignedRequest(payload: unknown, signatureSecret = APP_SECRET) {
  const body = JSON.stringify(payload);
  const signature = createHmac("sha256", signatureSecret)
    .update(body)
    .digest("hex");

  return new Request("http://localhost/api/webhooks/whatsapp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hub-signature-256": `sha256=${signature}`,
    },
    body,
  });
}

describe("route webhook WhatsApp", () => {
  beforeEach(() => {
    enqueueWhatsAppCommand.mockReset();
    delete process.env.ADMINBTP_WHATSAPP_COMMANDS_ENABLED;
    delete process.env.ADMINBTP_WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    delete process.env.ADMINBTP_WHATSAPP_APP_SECRET;
    delete process.env.ADMINBTP_WHATSAPP_ALLOWED_SENDERS;
  });

  it("refuse la verification Meta tant que le token serveur manque", async () => {
    const { GET } = await import("@/app/api/webhooks/whatsapp/route");
    const response = await GET(
      new Request(
        "http://localhost/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=test&hub.challenge=1234",
      ),
    );

    expect(response.status).toBe(503);
  });

  it("retourne le challenge uniquement avec le bon token", async () => {
    process.env.ADMINBTP_WHATSAPP_WEBHOOK_VERIFY_TOKEN = "verify-test";
    const { GET } = await import("@/app/api/webhooks/whatsapp/route");
    const validResponse = await GET(
      new Request(
        "http://localhost/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=verify-test&hub.challenge=challenge-42",
      ),
    );
    const invalidResponse = await GET(
      new Request(
        "http://localhost/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=challenge-42",
      ),
    );

    expect(validResponse.status).toBe(200);
    expect(await validResponse.text()).toBe("challenge-42");
    expect(invalidResponse.status).toBe(403);
  });

  it("refuse une signature Meta invalide", async () => {
    process.env.ADMINBTP_WHATSAPP_APP_SECRET = APP_SECRET;
    const { POST } = await import("@/app/api/webhooks/whatsapp/route");
    const response = await POST(createSignedRequest(buildPayload(), "wrong-secret"));

    expect(response.status).toBe(401);
    expect(enqueueWhatsAppCommand).not.toHaveBeenCalled();
  });

  it("acquitte sans persister lorsque la passerelle est desactivee", async () => {
    process.env.ADMINBTP_WHATSAPP_APP_SECRET = APP_SECRET;
    const { POST } = await import("@/app/api/webhooks/whatsapp/route");
    const response = await POST(createSignedRequest(buildPayload()));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.gateway).toBe("disabled");
    expect(enqueueWhatsAppCommand).not.toHaveBeenCalled();
  });

  it("persiste une demande autorisee sans exposer le numero dans la reponse", async () => {
    process.env.ADMINBTP_WHATSAPP_COMMANDS_ENABLED = "true";
    process.env.ADMINBTP_WHATSAPP_APP_SECRET = APP_SECRET;
    process.env.ADMINBTP_WHATSAPP_ALLOWED_SENDERS = "+262690000000";
    enqueueWhatsAppCommand.mockResolvedValue({
      status: "persisted",
      commandId: "command_1",
    });
    const { POST } = await import("@/app/api/webhooks/whatsapp/route");
    const response = await POST(createSignedRequest(buildPayload()));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      gateway: "active",
      accepted: 1,
      duplicate: 0,
      ignored: 0,
    });
    expect(JSON.stringify(body)).not.toContain("262690000000");
    expect(enqueueWhatsAppCommand).toHaveBeenCalledWith(
      expect.objectContaining({ commandText: "Continue la phase suivante" }),
      expect.stringMatching(/^[a-f0-9]{64}$/),
    );
  });

  it("ignore silencieusement un expediteur non autorise", async () => {
    process.env.ADMINBTP_WHATSAPP_COMMANDS_ENABLED = "true";
    process.env.ADMINBTP_WHATSAPP_APP_SECRET = APP_SECRET;
    process.env.ADMINBTP_WHATSAPP_ALLOWED_SENDERS = "+262690000000";
    const { POST } = await import("@/app/api/webhooks/whatsapp/route");
    const response = await POST(
      createSignedRequest(buildPayload({ sender: "33600000000" })),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ignored).toBe(1);
    expect(enqueueWhatsAppCommand).not.toHaveBeenCalled();
  });

  it("demande un nouvel essai Meta si la file Supabase est indisponible", async () => {
    process.env.ADMINBTP_WHATSAPP_COMMANDS_ENABLED = "true";
    process.env.ADMINBTP_WHATSAPP_APP_SECRET = APP_SECRET;
    process.env.ADMINBTP_WHATSAPP_ALLOWED_SENDERS = "+262690000000";
    enqueueWhatsAppCommand.mockResolvedValue({ status: "unavailable" });
    const { POST } = await import("@/app/api/webhooks/whatsapp/route");
    const response = await POST(createSignedRequest(buildPayload()));

    expect(response.status).toBe(503);
  });
});
