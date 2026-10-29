import { z } from "zod";
import { DocumentCategory } from "./document";

/**
 * Bibliothèque de modèles de documents premium — Phase C du module Marketplace (voir
 * docs/MONETIZATION_AND_ENTITLEMENTS.md et docs/ROADMAP.md). Catalogue partagé (pas de tenant) :
 * chaque modèle référence un service déjà existant du catalogue Phase A (`serviceCode`, ex:
 * "templates.moe") pour sa catégorisation/tarification d'affichage. L'accès effectif à la
 * génération ne passe JAMAIS par `has_entitlement()` sur ce service : il passe exclusivement par
 * `TemplatePurchase` ci-dessous — un modèle acheté reste utilisable même si l'abonnement au
 * service sous-jacent n'est plus actif, et même si le modèle est retiré du catalogue
 * (`isActive: false`) — invariant explicite du roadmap. Réutilise le moteur de génération
 * existant (`DocumentTemplate`/`generateDocumentFromTemplate`, voir document.ts) : un modèle
 * premium est généré par le même pipeline (IA + rendu PDF), jamais un second moteur.
 */
export const PremiumDocumentTemplate = z.object({
  id: z.string().uuid(),
  serviceCode: z.string().min(1),
  code: z.string().min(1), // identifiant stable (ex: "templates.moe.doe_structure")
  name: z.string().min(1),
  description: z.string().optional(),
  category: DocumentCategory,
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PremiumDocumentTemplate = z.infer<typeof PremiumDocumentTemplate>;

/**
 * Version d'un modèle premium — jamais supprimée, même après la publication d'une nouvelle
 * version ou le retrait du modèle du catalogue : un achat (`TemplatePurchase.versionId`) et un
 * document déjà généré (`Document.premiumTemplateVersionId`) doivent toujours pouvoir la
 * résoudre.
 */
export const TemplateVersion = z.object({
  id: z.string().uuid(),
  templateCatalogId: z.string().uuid(),
  versionNumber: z.number().int().positive(),
  fileUrl: z.string(), // chemin Storage privé (modèle DOCX source)
  variables: z.array(z.string()).default([]),
  requiresExpertReview: z.boolean().default(false),
  changelog: z.string().optional(),
  createdByUserId: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type TemplateVersion = z.infer<typeof TemplateVersion>;

/**
 * Achat d'un modèle premium par une organisation — jamais redistribué entre organisations (une
 * ligne par organisation x modèle, contrainte unique en base). `versionId` est figé au moment de
 * l'octroi (même principe que `OrganizationEntitlement.priceId` en Phase A) ;
 * `approve_template_purchase_request()` peut le faire avancer vers une version plus récente sans
 * dupliquer la ligne. Écrite exclusivement par cette fonction `SECURITY DEFINER` — aucune policy
 * RLS d'écriture, même règle non négociable que `organization_entitlements` en Phase A.
 */
export const TemplatePurchase = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  templateCatalogId: z.string().uuid(),
  versionId: z.string().uuid(),
  purchasedByUserId: z.string().uuid(),
  purchasedAt: z.string().datetime(),
  sourceAccessRequestId: z.string().uuid().optional(),
  note: z.string().optional(),
});
export type TemplatePurchase = z.infer<typeof TemplatePurchase>;
