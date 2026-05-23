import { createClient } from "@/lib/supabase/server";
import { loadServerOrganizationScope } from "@/lib/permissions";
import { getDemoMailboxBoardData } from "@/modules/emails/services/demo-emails";
import type {
  EmailRecord,
  Mailbox,
  MailboxBoardData,
  MailboxBoardQuery,
  MailboxResolution,
} from "@/modules/emails/types/email";
import type { NormalizedInboundEmailWebhookPayload } from "@/modules/emails/types/webhook";
import type { Tables } from "@/types/supabase";

type MailboxRow = Tables<"mailboxes">;
type EmailRow = Tables<"emails">;

export type PersistedInboundEmailResult = {
  persisted: boolean;
  dataOrigin: "demo" | "supabase";
  emailId?: string;
  duplicateOfEmailId?: string;
  reason?: string;
};

export type EmailSupabaseReader = {
  listActiveMailboxes: (query?: MailboxBoardQuery) => Promise<MailboxRow[]>;
  listEmailsByMailbox: (mailboxId: string) => Promise<EmailRow[]>;
  findMailboxByOrganizationAndAddress: (
    organizationId: string,
    address: string,
  ) => Promise<MailboxRow | null>;
  findEmailByExternalMessageId: (
    mailboxId: string,
    externalMessageId: string,
  ) => Promise<EmailRow | null>;
  insertEmail: (email: {
    mailbox_id: string;
    organization_id: string;
    project_id?: string | null;
    related_task_id?: string | null;
    external_message_id?: string | null;
    sender_email: string;
    sender_name?: string | null;
    subject: string;
    body_text: string;
    classification: EmailRow["classification"];
    received_at?: string;
  }) => Promise<EmailRow>;
};

function mapMailboxRow(mailbox: MailboxRow): Mailbox {
  return {
    id: mailbox.id,
    organizationId: mailbox.organization_id,
    address: mailbox.address,
    displayName: mailbox.display_name,
    provider: mailbox.provider,
    isActive: mailbox.is_active,
  };
}

function mapEmailRow(email: EmailRow): EmailRecord {
  return {
    id: email.id,
    mailboxId: email.mailbox_id,
    organizationId: email.organization_id,
    projectId: email.project_id ?? undefined,
    receivedAt: email.received_at,
    relatedTaskId: email.related_task_id ?? undefined,
    senderEmail: email.sender_email,
    senderName: email.sender_name ?? undefined,
    subject: email.subject,
    bodyText: email.body_text,
    classification: email.classification,
  };
}

export async function createEmailSupabaseReader(): Promise<EmailSupabaseReader | null> {
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const organizationScope = await loadServerOrganizationScope(supabase);

  if (!organizationScope) {
    return null;
  }

  const accessibleOrganizationIds = organizationScope.accessibleOrganizationIds;

  return {
    async listActiveMailboxes(query) {
      let request = supabase
        .from("mailboxes")
        .select("*")
        .in("organization_id", accessibleOrganizationIds)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (query?.organizationId) {
        request = request.eq("organization_id", query.organizationId);
      }

      if (query?.mailboxAddress) {
        request = request.eq("address", query.mailboxAddress);
      }

      if (query?.mailboxId) {
        request = request.eq("id", query.mailboxId);
      }

      const { data, error } = await request;

      if (error) {
        throw error;
      }

      return data ?? [];
    },
    async listEmailsByMailbox(mailboxId) {
      const { data, error } = await supabase
        .from("emails")
        .select("*")
        .eq("mailbox_id", mailboxId)
        .in("organization_id", accessibleOrganizationIds)
        .order("received_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data ?? [];
    },
    async findMailboxByOrganizationAndAddress(organizationId, address) {
      if (!accessibleOrganizationIds.includes(organizationId)) {
        return null;
      }

      const { data, error } = await supabase
        .from("mailboxes")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("address", address)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    async findEmailByExternalMessageId(mailboxId, externalMessageId) {
      const { data, error } = await supabase
        .from("emails")
        .select("*")
        .eq("mailbox_id", mailboxId)
        .eq("external_message_id", externalMessageId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    async insertEmail(email) {
      if (!accessibleOrganizationIds.includes(email.organization_id)) {
        throw new Error("Le scope serveur courant ne couvre pas cette organisation.");
      }

      const { data, error } = await supabase
        .from("emails")
        .insert(email)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
  };
}

export async function getMailboxBoardData(
  query?: MailboxBoardQuery,
  reader?: EmailSupabaseReader | null,
): Promise<MailboxBoardData> {
  const resolvedReader = reader ?? (await createEmailSupabaseReader());

  if (!resolvedReader) {
    return getDemoMailboxBoardData();
  }

  try {
    const mailboxes = await resolvedReader.listActiveMailboxes(query);
    const mailbox = mailboxes[0];

    if (!mailbox) {
      return {
        ...getDemoMailboxBoardData(),
        fallbackReason: "Aucune boite active n'a ete trouvee en base.",
      };
    }

    const emails = await resolvedReader.listEmailsByMailbox(mailbox.id);

    return {
      mailbox: mapMailboxRow(mailbox),
      emails: emails.map(mapEmailRow),
      dataOrigin: "supabase",
    };
  } catch {
    return {
      ...getDemoMailboxBoardData(),
      fallbackReason: "Lecture Supabase impossible, bascule vers les donnees de demonstration.",
    };
  }
}

export async function persistInboundEmail(
  payload: NormalizedInboundEmailWebhookPayload,
  reader?: EmailSupabaseReader | null,
): Promise<PersistedInboundEmailResult> {
  const resolvedReader = reader ?? (await createEmailSupabaseReader());

  if (!payload.persistEmail) {
    return {
      persisted: false,
      dataOrigin: resolvedReader ? "supabase" : "demo",
      reason: "La persistance a ete desactivee par le webhook entrant.",
    };
  }

  if (!resolvedReader) {
    return {
      persisted: false,
      dataOrigin: "demo",
      reason: "Client Supabase indisponible pour persister l'email entrant.",
    };
  }

  if (!payload.senderEmail || !payload.subject || !payload.bodyText) {
    return {
      persisted: false,
      dataOrigin: "supabase",
      reason:
        "Les champs senderEmail, subject et bodyText sont necessaires pour persister l'email entrant.",
    };
  }

  try {
    const mailbox = await resolvedReader.findMailboxByOrganizationAndAddress(
      payload.organizationId,
      payload.mailboxAddress,
    );

    if (!mailbox) {
      return {
        persisted: false,
        dataOrigin: "supabase",
        reason: "Aucune boite active n'a ete resolue pour persister l'email entrant.",
      };
    }

    if (payload.externalMessageId) {
      const existingEmail = await resolvedReader.findEmailByExternalMessageId(
        mailbox.id,
        payload.externalMessageId,
      );

      if (existingEmail) {
        return {
          persisted: false,
          dataOrigin: "supabase",
          duplicateOfEmailId: existingEmail.id,
          reason: "Un email avec le meme externalMessageId existe deja.",
        };
      }
    }

    const insertedEmail = await resolvedReader.insertEmail({
      mailbox_id: mailbox.id,
      organization_id: payload.organizationId,
      project_id: payload.projectId ?? null,
      related_task_id: payload.relatedTaskId ?? null,
      external_message_id: payload.externalMessageId ?? null,
      sender_email: payload.senderEmail,
      sender_name: payload.senderName ?? null,
      subject: payload.subject,
      body_text: payload.bodyText,
      classification: payload.classification,
      received_at: payload.receivedAt,
    });

    return {
      persisted: true,
      dataOrigin: "supabase",
      emailId: insertedEmail.id,
    };
  } catch {
    return {
      persisted: false,
      dataOrigin: "supabase",
      reason: "Une erreur Supabase a empeche la persistance de l'email entrant.",
    };
  }
}

export async function resolveMailboxForInboundWebhook(
  organizationId: string,
  sourceEmail: string,
  reader?: EmailSupabaseReader | null,
): Promise<MailboxResolution> {
  const resolvedReader = reader ?? (await createEmailSupabaseReader());

  if (!resolvedReader) {
    return {
      mailboxId: null,
      dataOrigin: "demo",
    };
  }

  try {
    const mailbox = await resolvedReader.findMailboxByOrganizationAndAddress(
      organizationId,
      sourceEmail,
    );

    return {
      mailboxId: mailbox?.id ?? null,
      dataOrigin: "supabase",
    };
  } catch {
    return {
      mailboxId: null,
      dataOrigin: "demo",
    };
  }
}
