import { vi } from "vitest";

import {
  getMailboxBoardData,
  persistInboundEmail,
  resolveMailboxForInboundWebhook,
} from "@/modules/emails/services/supabase-email-data";
import type { EmailSupabaseReader } from "@/modules/emails/services/supabase-email-data";
import { validateInboundEmailWebhookPayload } from "@/modules/emails/services/n8n-workflows";
import type { Tables } from "@/types/supabase";

function createMailbox(overrides: Partial<Tables<"mailboxes">> = {}): Tables<"mailboxes"> {
  return {
    id: "mailbox_001",
    address: "client@adminbtp.yt",
    created_at: "2026-05-01T00:00:00.000Z",
    created_by: "user_001",
    display_name: "Boite client AdminBTP",
    is_active: true,
    organization_id: "org_adminbtp_001",
    provider: "internal",
    provider_config: {},
    updated_at: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

function createEmail(overrides: Partial<Tables<"emails">> = {}): Tables<"emails"> {
  return {
    id: "email_001",
    body_text: "Bonjour, merci de relancer la piece manquante.",
    classification: "task",
    created_at: "2026-05-19T08:15:00.000Z",
    external_message_id: null,
    mailbox_id: "mailbox_001",
    organization_id: "org_adminbtp_001",
    project_id: "project_001",
    received_at: "2026-05-19T08:15:00.000Z",
    related_task_id: "task_relance_docs_001",
    sender_email: "conducteur@groupement-tce.fr",
    sender_name: "Conducteur TCE",
    subject: "Pieces manquantes",
    updated_at: "2026-05-19T08:15:00.000Z",
    ...overrides,
  };
}

function createReader(overrides: Partial<EmailSupabaseReader> = {}): EmailSupabaseReader {
  return {
    listActiveMailboxes: async () => [createMailbox()],
    listEmailsByMailbox: async () => [createEmail()],
    findMailboxByOrganizationAndAddress: async () => createMailbox(),
    findEmailByExternalMessageId: async () => null,
    insertEmail: async () => createEmail(),
    ...overrides,
  };
}

describe("chargement emails via Supabase", () => {
  it("bascule sur les donnees de demonstration sans lecteur Supabase", async () => {
    const data = await getMailboxBoardData(undefined, null);

    expect(data.dataOrigin).toBe("demo");
    expect(data.emails.length).toBeGreaterThan(0);
  });

  it("retourne les donnees Supabase si la boite et les emails existent", async () => {
    const data = await getMailboxBoardData(undefined, createReader());

    expect(data.dataOrigin).toBe("supabase");
    expect(data.mailbox.displayName).toBe("Boite client AdminBTP");
    expect(data.emails[0]?.receivedAt).toBe("2026-05-19T08:15:00.000Z");
  });

  it("filtre la boite cible lorsqu'un mailboxId est fourni", async () => {
    const listActiveMailboxes = vi.fn(async () => [
      createMailbox({ id: "mailbox_002", address: "autre@adminbtp.yt" }),
    ]);

    const data = await getMailboxBoardData(
      {
        mailboxId: "mailbox_002",
      },
      createReader({
        listActiveMailboxes,
      }),
    );

    expect(listActiveMailboxes).toHaveBeenCalledWith({
      mailboxId: "mailbox_002",
    });
    expect(data.mailbox.id).toBe("mailbox_002");
  });

  it("resout une boite pour le webhook entrant si elle existe", async () => {
    const resolution = await resolveMailboxForInboundWebhook(
      "org_adminbtp_001",
      "client@adminbtp.yt",
      createReader(),
    );

    expect(resolution.dataOrigin).toBe("supabase");
    expect(resolution.mailboxId).toBe("mailbox_001");
  });

  it("persiste un email entrant quand la boite et les donnees sont resolues", async () => {
    const payload = validateInboundEmailWebhookPayload({
      organizationId: "org_adminbtp_001",
      projectId: "project_001",
      sourceEmail: "client@adminbtp.yt",
      mailboxAddress: "client@adminbtp.yt",
      subject: "Pieces manquantes",
      bodyText: "Merci de transmettre la piece.",
      senderEmail: "conducteur@groupement-tce.fr",
      externalMessageId: "msg_001",
    });

    expect(payload.success).toBe(true);
    if (!payload.success) {
      return;
    }

    const result = await persistInboundEmail(payload.data, createReader());

    expect(result.persisted).toBe(true);
    expect(result.emailId).toBe("email_001");
  });

  it("evite de persister un doublon base sur externalMessageId", async () => {
    const payload = validateInboundEmailWebhookPayload({
      organizationId: "org_adminbtp_001",
      sourceEmail: "client@adminbtp.yt",
      mailboxAddress: "client@adminbtp.yt",
      subject: "Pieces manquantes",
      bodyText: "Merci de transmettre la piece.",
      senderEmail: "conducteur@groupement-tce.fr",
      externalMessageId: "msg_001",
    });

    expect(payload.success).toBe(true);
    if (!payload.success) {
      return;
    }

    const result = await persistInboundEmail(
      payload.data,
      createReader({
        findEmailByExternalMessageId: async () => createEmail(),
      }),
    );

    expect(result.persisted).toBe(false);
    expect(result.duplicateOfEmailId).toBe("email_001");
  });

  it("retourne une raison explicite si la persistance echoue cote Supabase", async () => {
    const payload = validateInboundEmailWebhookPayload({
      organizationId: "org_adminbtp_001",
      sourceEmail: "client@adminbtp.yt",
      mailboxAddress: "client@adminbtp.yt",
      subject: "Pieces manquantes",
      bodyText: "Merci de transmettre la piece.",
      senderEmail: "conducteur@groupement-tce.fr",
    });

    expect(payload.success).toBe(true);
    if (!payload.success) {
      return;
    }

    const result = await persistInboundEmail(
      payload.data,
      createReader({
        insertEmail: async () => {
          throw new Error("Erreur SQL");
        },
      }),
    );

    expect(result.persisted).toBe(false);
    expect(result.reason).toContain("Une erreur Supabase");
  });
});
