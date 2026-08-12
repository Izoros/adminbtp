import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveMailboxForInboundWebhook = vi.fn();
const persistInboundEmail = vi.fn();
const createEmailSupabaseReader = vi.fn();
const resolveSignatureWebhookContext = vi.fn();

vi.mock("@/modules/emails/services/supabase-email-data", () => ({
  resolveMailboxForInboundWebhook,
  persistInboundEmail,
  createEmailSupabaseReader,
}));

vi.mock("@/modules/signatures/services/signature-webhook-data", () => ({
  resolveSignatureWebhookContext,
}));

describe("routes n8n", () => {
  beforeEach(() => {
    resolveMailboxForInboundWebhook.mockReset();
    persistInboundEmail.mockReset();
    createEmailSupabaseReader.mockReset();
    resolveSignatureWebhookContext.mockReset();
    process.env.ADMINBTP_N8N_WEBHOOK_TOKEN = "secret-test";
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
          "x-adminbtp-webhook-token": "secret-test",
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

  it("retourne 400 si le webhook entrant contient un JSON invalide", async () => {
    const { POST } = await import("@/app/api/n8n/inbound-task/route");

    const response = await POST(
      new Request("http://localhost/api/n8n/inbound-task", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-adminbtp-webhook-token": "secret-test",
        },
        body: "{invalid-json",
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.errors).toContain("Le corps de requete doit contenir un JSON valide.");
  });

  it("retourne un contrat enrichi pour le webhook entrant valide", async () => {
    resolveMailboxForInboundWebhook.mockResolvedValue({
      mailboxId: "mailbox_001",
      dataOrigin: "supabase",
      mailboxCreated: false,
    });
    persistInboundEmail.mockResolvedValue({
      persisted: true,
      dataOrigin: "supabase",
      emailId: "email_001",
      mailboxId: "mailbox_001",
      mailboxCreated: false,
    });

    const { POST } = await import("@/app/api/n8n/inbound-task/route");

    const response = await POST(
      new Request("http://localhost/api/n8n/inbound-task", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-adminbtp-webhook-token": "secret-test",
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
    expect(body.authorization.protectionEnabled).toBe(true);
    expect(body.task.source).toBe("n8n");
    expect(body.mailboxResolution.mailboxId).toBe("mailbox_001");
    expect(body.mailboxResolution.mailboxCreated).toBe(false);
    expect(body.persistence.emailId).toBe("email_001");
  });

  it("accepte le token partage via le header dedie", async () => {
    process.env.ADMINBTP_N8N_WEBHOOK_TOKEN = "secret-test";
    resolveMailboxForInboundWebhook.mockResolvedValue({
      mailboxId: "mailbox_001",
      dataOrigin: "supabase",
      mailboxCreated: false,
    });
    persistInboundEmail.mockResolvedValue({
      persisted: true,
      dataOrigin: "supabase",
      emailId: "email_001",
      mailboxId: "mailbox_001",
      mailboxCreated: false,
    });

    const { POST } = await import("@/app/api/n8n/inbound-task/route");

    const response = await POST(
      new Request("http://localhost/api/n8n/inbound-task", {
        method: "POST",
        headers: {
          "content-type": "application/json; charset=utf-8",
          "x-adminbtp-webhook-token": "secret-test",
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

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.authorization.protectionEnabled).toBe(true);
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

  it("retourne 503 si le secret webhook n8n n'est pas configure", async () => {
    delete process.env.ADMINBTP_N8N_WEBHOOK_TOKEN;
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

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.errors).toContain(
      "Le webhook n8n est indisponible tant que son secret n'est pas configure.",
    );
  });

  it("retourne 502 si le traitement aval du webhook entrant echoue", async () => {
    resolveMailboxForInboundWebhook.mockRejectedValue(new Error("mailbox down"));

    const { POST } = await import("@/app/api/n8n/inbound-task/route");

    const response = await POST(
      new Request("http://localhost/api/n8n/inbound-task", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-adminbtp-webhook-token": "secret-test",
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

    expect(response.status).toBe(502);
    expect(body.ok).toBe(false);
    expect(body.errors).toContain("Le traitement du webhook entrant a echoue.");
  });

  it("remonte la creation automatique de boite si la persistance l'a declenchee", async () => {
    resolveMailboxForInboundWebhook.mockResolvedValue({
      mailboxId: null,
      dataOrigin: "supabase",
      mailboxCreated: false,
    });
    persistInboundEmail.mockResolvedValue({
      persisted: true,
      dataOrigin: "supabase",
      emailId: "email_002",
      mailboxId: "mailbox_created_001",
      mailboxCreated: true,
    });

    const { POST } = await import("@/app/api/n8n/inbound-task/route");

    const response = await POST(
      new Request("http://localhost/api/n8n/inbound-task", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-adminbtp-webhook-token": "secret-test",
        },
        body: JSON.stringify({
          organizationId: "org_adminbtp_001",
          sourceEmail: "client@adminbtp.yt",
          subject: "Document manquant",
          bodyText: "Relancer le sous-traitant",
          autoCreateMailbox: true,
          mailboxDisplayName: "Boite client AdminBTP",
          mailboxProvider: "internal",
        }),
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.mailboxResolution.mailboxId).toBe("mailbox_created_001");
    expect(body.mailboxResolution.mailboxCreated).toBe(true);
    expect(body.persistence.mailboxCreated).toBe(true);
  });

  it("retourne 400 si la demande de validation est invalide", async () => {
    const { POST } = await import("@/app/api/n8n/validation-request/route");

    const response = await POST(
      new Request("http://localhost/api/n8n/validation-request", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-adminbtp-webhook-token": "secret-test",
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
    resolveSignatureWebhookContext.mockResolvedValue({
      dataOrigin: "demo",
      requestId: "signature_request_001",
      whatsappPayload: null,
    });

    const { POST } = await import("@/app/api/n8n/validation-request/route");

    const response = await POST(
      new Request("http://localhost/api/n8n/validation-request", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-adminbtp-webhook-token": "secret-test",
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
    expect(body.authorization.protectionEnabled).toBe(true);
    expect(body.outboundPayload.channel).toBe("whatsapp");
    expect(body.outboundPayload.destination).toBe("+262690000000");
    expect(body.dataOrigin).toBe("demo");
  });

  it("reutilise le payload WhatsApp persiste si destination et body ne sont pas fournis", async () => {
    createEmailSupabaseReader.mockResolvedValue(null);
    resolveSignatureWebhookContext.mockResolvedValue({
      dataOrigin: "supabase",
      requestId: "signature_request_001",
      organizationId: "org_adminbtp_001",
      whatsappPayload: {
        channel: "whatsapp",
        destination: "+262690000000",
        destinationStatus: "pending_configuration",
        template: "signature_validation_v1",
        requestId: "signature_request_001",
        organizationId: "org_adminbtp_001",
        documentId: "document_001",
        preparedAt: "2026-05-23T10:00:00.000Z",
        message: "Validation requise",
        body: "Validation requise pour le compte rendu chantier.",
      },
    });

    const { POST } = await import("@/app/api/n8n/validation-request/route");

    const response = await POST(
      new Request("http://localhost/api/n8n/validation-request", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-adminbtp-webhook-token": "secret-test",
        },
        body: JSON.stringify({
          signatureRequestId: "signature_request_001",
        }),
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.outboundPayload.destination).toBe("+262690000000");
    expect(body.outboundPayload.body).toBe(
      "Validation requise pour le compte rendu chantier.",
    );
    expect(body.dataOrigin).toBe("supabase");
  });

  it("retourne 400 si aucun payload complet ne peut etre resolu pour la validation", async () => {
    createEmailSupabaseReader.mockResolvedValue(null);
    resolveSignatureWebhookContext.mockResolvedValue({
      dataOrigin: "demo",
      requestId: "signature_request_001",
      whatsappPayload: null,
    });

    const { POST } = await import("@/app/api/n8n/validation-request/route");

    const response = await POST(
      new Request("http://localhost/api/n8n/validation-request", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-adminbtp-webhook-token": "secret-test",
        },
        body: JSON.stringify({
          signatureRequestId: "signature_request_001",
        }),
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.errors).toContain(
      "Aucun payload WhatsApp complet n'a pu etre resolu pour cette demande de signature.",
    );
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

  it("retourne 400 si la route de validation recoit un JSON invalide", async () => {
    const { POST } = await import("@/app/api/n8n/validation-request/route");

    const response = await POST(
      new Request("http://localhost/api/n8n/validation-request", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-adminbtp-webhook-token": "secret-test",
        },
        body: "{invalid-json",
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.errors).toContain("Le corps de requete doit contenir un JSON valide.");
  });

  it("retourne 502 si la preparation aval de validation echoue", async () => {
    createEmailSupabaseReader.mockRejectedValue(new Error("reader down"));

    const { POST } = await import("@/app/api/n8n/validation-request/route");

    const response = await POST(
      new Request("http://localhost/api/n8n/validation-request", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-adminbtp-webhook-token": "secret-test",
        },
        body: JSON.stringify({
          signatureRequestId: "signature_request_001",
          destination: "+262690000000",
          body: "Validation requise",
        }),
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.ok).toBe(false);
    expect(body.errors).toContain("La preparation de la demande de validation a echoue.");
  });
});
