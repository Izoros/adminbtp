import type {
  DocumentTemplate,
  DocumentVariableMap,
  GeneratedDocument,
} from "@/modules/documents/types/document";

export const demoDocumentTemplates: DocumentTemplate[] = [
  {
    id: "template_001",
    organizationId: "org_adminbtp_001",
    code: "cr-chantier",
    name: "Compte rendu chantier",
    subject: "Compte rendu - {{project_name}} - {{meeting_date}}",
    bodyTemplate: `Bonjour {{recipient_name}},

Veuillez trouver ci-dessous le compte rendu du chantier {{project_name}}.

Objet :
- avancement global : {{progress_summary}}
- point d'attention : {{attention_point}}
- prochaine echeance : {{next_deadline}}

Cordialement,
{{sender_name}}`,
    letterheadName: "AdminBTP - Pole suivi chantier",
    logoLabel: "LOGO ADMINBTP",
    stampLabel: "Tampon chantier",
    signatureLabel: "Signature gestionnaire",
  },
];

export const demoDocumentVariables: DocumentVariableMap = {
  recipient_name: "Atelier MOE",
  project_name: "Renovation college Kaweni",
  meeting_date: "22 mai 2026",
  progress_summary: "les lots techniques restent en coordination",
  attention_point: "interface CVC / electricite a arbitrer",
  next_deadline: "30 mai 2026",
  sender_name: "Gestionnaire AdminBTP",
};

export const demoGeneratedDocuments: GeneratedDocument[] = [
  {
    id: "document_001",
    templateId: "template_001",
    title: "CR chantier - Renovation college Kaweni",
    subject: "Compte rendu - Renovation college Kaweni - 22 mai 2026",
    bodyRendered: `Bonjour Atelier MOE,

Veuillez trouver ci-dessous le compte rendu du chantier Renovation college Kaweni.

Objet :
- avancement global : les lots techniques restent en coordination
- point d'attention : interface CVC / electricite a arbitrer
- prochaine echeance : 30 mai 2026

Cordialement,
Gestionnaire AdminBTP`,
    status: "generated",
  },
];
