import { z } from "zod";

/**
 * Circuit d'approbation : préparation -> contrôle gestionnaire -> validation dirigeant
 * -> signature (si nécessaire) -> envoi -> archivage.
 * Important (règle produit non négociable) : une approbation WhatsApp n'est PAS une
 * signature électronique. Les trois notions sont distinctes et tracées séparément :
 *  - approval: autorisation d'envoi / décision humaine
 *  - whatsappProofUrl: preuve d'échange WhatsApp (simple élément de preuve, pas une signature)
 *  - signatureProvider / signatureEnvelopeId: signature électronique via prestataire dédié
 */
export const ValidationStep = z.enum([
  "PREPARATION",
  "CONTROLE_GESTIONNAIRE",
  "VALIDATION_DIRIGEANT",
  "SIGNATURE",
  "ENVOI",
  "ARCHIVAGE",
]);
export type ValidationStep = z.infer<typeof ValidationStep>;

export const ApprovalDecision = z.enum(["APPROUVE", "REFUSE", "MODIFICATION_DEMANDEE"]);
export type ApprovalDecision = z.infer<typeof ApprovalDecision>;

export const ValidationRecord = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  step: ValidationStep,
  decision: ApprovalDecision.optional(),
  decidedByUserId: z.string().uuid().optional(),
  decidedAt: z.string().datetime().optional(),
  comment: z.string().optional(),
  whatsappProofUrl: z.string().url().optional(),
  signatureProvider: z.string().optional(), // ex: "yousign", "docusign" — non branché en Phase 1
  signatureEnvelopeId: z.string().optional(),
  isLegallyBindingSignature: z.boolean().default(false),
});
export type ValidationRecord = z.infer<typeof ValidationRecord>;

/** Journal d'audit — toute action sensible doit y être tracée (RGPD + preuve). */
export const AuditLogEntry = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  actorUserId: z.string().uuid().nullable(), // null si action automatisée (n8n, IA)
  actorType: z.enum(["USER", "AUTOMATION", "AI"]),
  action: z.string().min(1), // ex: "document.validate", "mail.send"
  targetType: z.string(),
  targetId: z.string(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().datetime(),
});
export type AuditLogEntry = z.infer<typeof AuditLogEntry>;
