import {
  createTaskFromInboundWebhook,
  createValidationWebhookPayload,
  validateInboundEmailWebhookPayload,
  validateValidationRequestWebhookPayload,
} from "@/modules/emails/services/n8n-workflows";

describe("workflows n8n", () => {
  it("cree une tache interne a partir d'un webhook entrant", () => {
    const payload = validateInboundEmailWebhookPayload({
      organizationId: "org_adminbtp_001",
      projectId: "project_001",
      subject: "Document manquant",
      bodyText: "Relancer le sous-traitant",
      sourceEmail: "client@adminbtp.yt",
      senderEmail: "conducteur@groupement-tce.fr",
    });

    expect(payload.success).toBe(true);
    if (!payload.success) {
      return;
    }

    const task = createTaskFromInboundWebhook(payload.data);

    expect(task.source).toBe("n8n");
    expect(task.organizationId).toBe("org_adminbtp_001");
    expect(task.projectId).toBe("project_001");
  });

  it("prepare une demande de validation WhatsApp exploitable", () => {
    const payload = createValidationWebhookPayload(
      "signature_request_001",
      "+262690000000",
      "Validation requise",
    );

    expect(payload.channel).toBe("whatsapp");
    expect(payload.signatureRequestId).toBe("signature_request_001");
  });

  it("rejette un webhook entrant incomplet", () => {
    const payload = validateInboundEmailWebhookPayload({
      organizationId: "org_adminbtp_001",
      sourceEmail: "client@adminbtp.yt",
    });

    expect(payload.success).toBe(false);
    if (!payload.success) {
      expect(payload.errors).toContain("title ou subject est obligatoire.");
      expect(payload.errors).toContain("description ou bodyText est obligatoire.");
    }
  });

  it("rejette un webhook entrant avec emails invalides", () => {
    const payload = validateInboundEmailWebhookPayload({
      organizationId: "org_adminbtp_001",
      sourceEmail: "adresse-invalide",
      mailboxAddress: "mailbox-invalide",
      subject: "Document manquant",
      bodyText: "Relancer le sous-traitant",
      senderEmail: "sender-invalide",
    });

    expect(payload.success).toBe(false);
    if (!payload.success) {
      expect(payload.errors).toContain("sourceEmail doit etre une adresse email valide.");
      expect(payload.errors).toContain(
        "mailboxAddress doit etre une adresse email valide s'il est fourni.",
      );
      expect(payload.errors).toContain(
        "senderEmail doit etre une adresse email valide s'il est fourni.",
      );
    }
  });

  it("normalise le payload de validation sortante", () => {
    const payload = validateValidationRequestWebhookPayload({
      signatureRequestId: " signature_request_001 ",
      destination: " +262690000000 ",
      body: " Validation requise ",
    });

    expect(payload.success).toBe(true);
    if (payload.success) {
      expect(payload.data.channel).toBe("whatsapp");
      expect(payload.data.destination).toBe("+262690000000");
    }
  });

  it("accepte une demande de validation basee uniquement sur signatureRequestId", () => {
    const payload = validateValidationRequestWebhookPayload({
      signatureRequestId: " signature_request_001 ",
    });

    expect(payload.success).toBe(true);
    if (payload.success) {
      expect(payload.data.signatureRequestId).toBe("signature_request_001");
      expect(payload.data.destination).toBeUndefined();
      expect(payload.data.body).toBeUndefined();
    }
  });

  it("rejette une destination WhatsApp qui n'est pas au format E.164", () => {
    const payload = validateValidationRequestWebhookPayload({
      signatureRequestId: "signature_request_001",
      destination: "0690123456",
      body: "Validation requise",
    });

    expect(payload.success).toBe(false);
    if (!payload.success) {
      expect(payload.errors).toContain("destination doit etre un numero E.164 valide.");
    }
  });

  it("rejette toujours une demande sans signatureRequestId", () => {
    const payload = validateValidationRequestWebhookPayload({});

    expect(payload.success).toBe(false);
    if (!payload.success) {
      expect(payload.errors).toContain("signatureRequestId est obligatoire.");
    }
  });
});
