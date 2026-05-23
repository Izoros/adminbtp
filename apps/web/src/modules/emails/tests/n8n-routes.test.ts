import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveMailboxForInboundWebhook = vi.fn();
const persistInboundEmail = vi.fn();
const createEmailSupabaseReader = vi.fn();

vi.mock("@/modules/emails/services/supabase-email-data", () => ({
  resolveMailboxForInboundWebhook,
  persistInboundEmail,
  createEmailSupabaseReader,
}));

describe("routes n8n", () => {
  beforeEach(() => {
    resolveMailboxForInboundWebhook.mockReset();
    persistInboundEmail.mockReset();
    createEmailSupabaseReader.mockReset();
    delete process.env.ADMINBTP_N8N_WEBHOOK_TOKEN;
  });

  it("retourne 415 si le content-type n'est pas JSON", async () => {
    const { POST } = await import("@/app/api/n8n/inbound-task/route");

    const response = await POST(
      new Request("http://localhost/api/n8n/inbound-task", {
        method: "POST",
        headers: {
          "content-type": "text/plain",
        },
        body: "not-json",
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(415);
    expect(body.ok).toBe(false);
    expect(body.errors).toContain("Le content-type doit etre JSON.");
  });

  it("retourne 400 si le webhook entrant est invalide", async () => {
    const { POST } = await import("@/app/api/n8n/inbound-task/route");

    const response = await POST(
      new Request("http://localhost/api/n8n/inbound-task", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          organizationId: "org_adminbtp_001",
          sourceEmail: "client@adminbtp.yt",
        }),
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.errors).toContain("title ou subject est obligatoire.");
  });

  it("retourne un contrat enrichi pour le webhook entrant valide", async () => {
    resolveMailboxForInboundWebhook.mockResolvedValue({
      mailboxId: "mailbox_001",
      dataOrigin: "supabase",
    });
    persistInboundEmail.mockResolvedValue({
      persisted: true,
      dataOrigin: "supabase",
      emailId: "email_001",
    });

    const { POST } = await import("@/app/api/n8n/inbound-task/route");

    const response = await POST(
      new Request("http://localhost/api/n8n/inbound-task", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          organizationId: "org_adminbtp_001",
          sourceEmail: "client@adminbtp.yt",
          subject: "Document manquant",
          bodyText: "Relancer le sous-traitant",
          senderEmail: "conducteur@groupement-tce.fr",
        }),
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.authorization.protectionEnabled).toBe(false);
    expect(body.task.source).toBe("n8n");
    expect(body.mailboxResolution.mailboxId).toBe("mailbox_001");
    expect(body.persistence.emailId).toBe("email_001");
  });

  it("retourne 401 si le token webhook attendu n'est pas fourni", async () => {
    process.env.ADMINBTP_N8N_WEBHOOK_TOKEN = "secret-test";
    const { POST } = await import("@/app/api/n8n/inbound-task/route");

    const response = await POST(
      new Request("http://localhost/api/n8n/inbound-task", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          organizationId: "org_adminbtp_001",
          sourceEmail: "client@adminbtp.yt",
          subject: "Document manquant",
          bodyText: "Relancer le sous-traitant",
        }),
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.errors).toContain("Le token webhook est invalide ou absent.");
  });

  it("retourne 400 si la demande de validation est invalide", async () => {
    const { POST } = await import("@/app/api/n8n/validation-request/route");

    const response = await POST(
      new Request("http://localhost/api/n8n/validation-request", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          signatureRequestId: "",
          destination: "",
          body: "",
        }),
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.errors).toContain("signatureRequestId est obligatoire.");
  });

  it("retourne une charge sortante normalisee pour la validation", async () => {
    createEmailSupabaseReader.mockResolvedValue(null);

    const { POST } = await import("@/app/api/n8n/validation-request/route");

    const response = await POST(
      new Request("http://localhost/api/n8n/validation-request", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          signatureRequestId: " signature_request_001 ",
          destination: " +262690000000 ",
          body: " Validation requise ",
        }),
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.authorization.protectionEnabled).toBe(false);
    expect(body.outboundPayload.channel).toBe("whatsapp");
    expect(body.outboundPayload.destination).toBe("+262690000000");
    expect(body.dataOrigin).toBe("demo");
  });

  it("retourne 415 si la route de validation ne recoit pas un payload JSON", async () => {
    const { POST } = await import("@/app/api/n8n/validation-request/route");

    const response = await POST(
      new Request("http://localhost/api/n8n/validation-request", {
        method: "POST",
        headers: {
          "content-type": "text/plain",
        },
        body: "not-json",
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(415);
    expect(body.ok).toBe(false);
    expect(body.errors).toContain("Le content-type doit etre JSON.");
  });
});
