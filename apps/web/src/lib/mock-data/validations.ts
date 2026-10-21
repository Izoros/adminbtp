import type { ValidationRecord } from "@adminbtp/types";

export const mockValidations: ValidationRecord[] = [
  {
    id: "val-1",
    documentId: "doc-2",
    step: "VALIDATION_DIRIGEANT",
    isLegallyBindingSignature: false,
  },
  {
    id: "val-2",
    documentId: "doc-3",
    step: "CONTROLE_GESTIONNAIRE",
    isLegallyBindingSignature: false,
  },
  {
    id: "val-3",
    documentId: "doc-1",
    step: "CONTROLE_GESTIONNAIRE",
    decision: "MODIFICATION_DEMANDEE",
    decidedByUserId: "user-1",
    decidedAt: "2026-01-28T10:00:00.000Z",
    comment: "Mise à jour du plan d'installation de chantier nécessaire avant validation.",
    isLegallyBindingSignature: false,
  },
  {
    id: "val-4",
    documentId: "doc-6",
    step: "ENVOI",
    decision: "APPROUVE",
    decidedByUserId: "user-1",
    decidedAt: "2026-09-26T08:00:00.000Z",
    whatsappProofUrl: "demo://whatsapp/proof-doc-6.png",
    isLegallyBindingSignature: false,
  },
];
