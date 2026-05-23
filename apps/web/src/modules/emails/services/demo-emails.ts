import type { EmailRecord, Mailbox } from "@/modules/emails/types/email";

export const demoMailboxes: Mailbox[] = [
  {
    id: "mailbox_001",
    organizationId: "org_adminbtp_001",
    address: "client@adminbtp.yt",
    displayName: "Boite client AdminBTP",
    provider: "internal",
    isActive: true,
  },
];

export const demoEmails: EmailRecord[] = [
  {
    id: "email_001",
    mailboxId: "mailbox_001",
    organizationId: "org_adminbtp_001",
    projectId: "project_001",
    receivedAt: "2026-05-19T08:15:00.000Z",
    relatedTaskId: "task_relance_docs_001",
    senderEmail: "conducteur@groupement-tce.fr",
    senderName: "Conducteur TCE",
    subject: "Pieces manquantes pour la situation du mois",
    bodyText:
      "Bonjour, il manque encore le bordereau du sous-traitant principal et la version signee du tableau de situation.",
    classification: "task",
  },
  {
    id: "email_002",
    mailboxId: "mailbox_001",
    organizationId: "org_adminbtp_001",
    projectId: "project_001",
    receivedAt: "2026-05-19T14:45:00.000Z",
    senderEmail: "maitrise.oeuvre@atelier-moe.fr",
    senderName: "Atelier MOE",
    subject: "Transmission du CR chantier",
    bodyText:
      "Merci de transmettre le compte rendu chantier finalise avant diffusion client.",
    classification: "document",
  },
];

export function getDemoMailboxBoardData() {
  return {
    mailbox: demoMailboxes[0]!,
    emails: demoEmails,
    dataOrigin: "demo" as const,
    fallbackReason: "Configuration Supabase absente ou lecture distante indisponible.",
  };
}
