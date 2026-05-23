import type { GeneratedDocument } from "@/modules/documents/types/document";
import type { EmailRecord } from "@/modules/emails/types/email";
import type { Project } from "@/modules/projects/types/project";
import type { AiSuggestion, AiSuggestionAuditLog } from "@/modules/ai/types/ai";

export const demoAiEmail: EmailRecord = {
  id: "email_ia_001",
  mailboxId: "mailbox_001",
  organizationId: "org_adminbtp_001",
  projectId: "project_001",
  senderEmail: "maitrise.oeuvre@chantier.example",
  senderName: "Cabinet MOE",
  subject: "PPSPS a completer avant vendredi",
  bodyText:
    "Merci de nous transmettre une version complete du PPSPS avec les zones de circulation, les entreprises presentes et les mesures de protection collective.",
  classification: "client_message",
};

export const demoAiDocument: GeneratedDocument = {
  id: "document_ia_001",
  templateId: "template_001",
  title: "PPSPS Lot Gros Oeuvre",
  subject: "PPSPS provisoire",
  bodyRendered:
    "PPSPS provisoire a completer avec les modes operatoires, les interfaces et les mesures de prevention.",
  status: "draft",
};

export const demoAiProject: Project = {
  id: "project_001",
  code: "CH-001",
  slug: "rehabilitation-college-kaweni",
  name: "Rehabilitation College Kaweni",
  description: "Operation de rehabilitation en site occupe.",
  status: "active",
  ownerOrganizationId: "org_adminbtp_001",
  startsOn: "2026-01-15",
  endsOn: "2026-11-30",
};

export const demoAiSuggestions: AiSuggestion[] = [
  {
    id: "ai_suggestion_001",
    organizationId: "org_adminbtp_001",
    projectId: "project_001",
    sourceEntityType: "email",
    sourceEntityId: "email_ia_001",
    kind: "email_summary",
    title: "Resume du mail MOE",
    summary: "Le MOE demande un PPSPS complet avant vendredi.",
    promptSnapshot: "Resumer le message et identifier l'action attendue.",
    outputPayload: {
      summary:
        "Le maitre d'oeuvre attend une version complete du PPSPS avec circulation, coactivite et protections collectives.",
      nextAction: "Preparer une nouvelle version du PPSPS pour validation interne.",
    },
    status: "pending_human_validation",
    proposedBy: "ai",
  },
  {
    id: "ai_suggestion_002",
    organizationId: "org_adminbtp_001",
    projectId: "project_001",
    sourceEntityType: "document",
    sourceEntityId: "document_ia_001",
    kind: "document_classification",
    title: "Classification du document PPSPS",
    summary: "Le document est reconnu comme un PPSPS a completer.",
    promptSnapshot: "Classer le document selon les familles AdminBTP.",
    outputPayload: {
      detectedType: "ppsps",
      confidence: "elevee",
      missingSections: "modes operatoires, interfaces, plan de circulation",
    },
    status: "approved",
    proposedBy: "ai",
    validatedBy: "user_admin_001",
  },
  {
    id: "ai_suggestion_003",
    organizationId: "org_adminbtp_001",
    projectId: "project_001",
    sourceEntityType: "project",
    sourceEntityId: "project_001",
    kind: "letter_draft",
    title: "Projet de courrier de transmission",
    summary: "Proposition de courrier pour transmettre le PPSPS revise.",
    promptSnapshot: "Generer un courrier de transmission formel au MOE.",
    outputPayload: {
      recipient: "Cabinet MOE",
      draft:
        "Nous vous transmettons une version revisee du PPSPS integree aux demandes relatives aux circulations, interfaces et protections collectives.",
    },
    status: "rejected",
    proposedBy: "ai",
    validatedBy: "user_admin_001",
  },
];

export const demoAiAuditLogs: AiSuggestionAuditLog[] = [
  {
    id: "ai_audit_001",
    aiSuggestionId: "ai_suggestion_001",
    actorType: "ai",
    action: "proposed",
    details: "Proposition generee depuis un mail entrant.",
  },
  {
    id: "ai_audit_002",
    aiSuggestionId: "ai_suggestion_002",
    actorType: "user",
    actorId: "user_admin_001",
    action: "approved",
    details: "Classification confirmee avant rattachement manuel.",
  },
  {
    id: "ai_audit_003",
    aiSuggestionId: "ai_suggestion_003",
    actorType: "user",
    actorId: "user_admin_001",
    action: "rejected",
    details: "Le courrier doit etre reformule avant envoi.",
  },
];
