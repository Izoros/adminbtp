import { z } from "zod";

/**
 * Module entitlements — marketplace de fonctionnalités et moteur d'autorisation (Phase A).
 * Voir docs/MONETIZATION_AND_ENTITLEMENTS.md pour les règles produit complètes.
 *
 * Règle non négociable : seul un utilisateur ADMIN_PLATEFORME ("Super Administrateur" — rôle
 * déjà existant dans UserPermissionRole, aucun rôle redondant créé) peut accorder, suspendre,
 * prolonger ou révoquer un entitlement. Un paiement ou une demande n'active jamais rien tout
 * seul — voir ServiceCatalogItem.requiresAdminApproval.
 */

export const ServiceCategoryCode = z.enum([
  "DIRECTORY",
  "DOCUMENTS",
  "AUTOMATION",
  "AI",
  "MESSAGING",
  "SITE_MANAGEMENT",
  "INTEGRATIONS",
  "SIGNATURES",
  "EXPERT_SERVICES",
  "CUSTOM_SERVICES",
]);
export type ServiceCategoryCode = z.infer<typeof ServiceCategoryCode>;

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategoryCode, string> = {
  DIRECTORY: "Annuaires",
  DOCUMENTS: "Documents",
  AUTOMATION: "Automatisations",
  AI: "Intelligence artificielle",
  MESSAGING: "Messagerie",
  SITE_MANAGEMENT: "Gestion de chantier",
  INTEGRATIONS: "Intégrations",
  SIGNATURES: "Signatures",
  EXPERT_SERVICES: "Expertise humaine",
  CUSTOM_SERVICES: "Prestations personnalisées",
};

export const ServiceCategory = z.object({
  id: z.string().uuid(),
  code: ServiceCategoryCode,
  label: z.string().min(1),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
});
export type ServiceCategory = z.infer<typeof ServiceCategory>;

export const ServiceBillingModel = z.enum([
  "FREE",
  "SUBSCRIPTION_MONTHLY",
  "SUBSCRIPTION_ANNUAL",
  "PER_UNIT",
  "PREPAID_CREDIT",
  "CREDIT_PACK",
  "SERVICE_PACKAGE",
  "CUSTOM",
  "QUOTE",
]);
export type ServiceBillingModel = z.infer<typeof ServiceBillingModel>;

export const BILLING_MODEL_LABELS: Record<ServiceBillingModel, string> = {
  FREE: "Gratuit",
  SUBSCRIPTION_MONTHLY: "Abonnement mensuel",
  SUBSCRIPTION_ANNUAL: "Abonnement annuel",
  PER_UNIT: "Paiement à l'unité",
  PREPAID_CREDIT: "Crédit prépayé",
  CREDIT_PACK: "Pack de crédits",
  SERVICE_PACKAGE: "Forfait de prestations",
  CUSTOM: "Tarif personnalisé",
  QUOTE: "Sur devis",
};

/**
 * Catalogue central (partagé entre toutes les organisations, pas de tenant). `code` est
 * l'identifiant stable utilisé dans le code applicatif (ex: "directory.btp") — jamais l'id
 * technique, qui ne doit pas être codé en dur côté client.
 */
export const ServiceCatalogItem = z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  billingModel: ServiceBillingModel,
  requiresAdminApproval: z.boolean().default(true),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ServiceCatalogItem = z.infer<typeof ServiceCatalogItem>;

/**
 * Prix versionné : un changement de tarif ne modifie jamais rétroactivement un entitlement déjà
 * accordé (qui référence le price_id en vigueur au moment de l'octroi). `effectiveTo` null =
 * tarif actuellement en vigueur.
 */
export const ServicePrice = z.object({
  id: z.string().uuid(),
  serviceId: z.string().uuid(),
  amountCents: z.number().int().nonnegative(),
  currency: z.string().default("EUR"),
  billingPeriod: z.enum(["MONTHLY", "ANNUAL", "ONE_TIME"]).default("ONE_TIME"),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime().optional(),
  createdByUserId: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type ServicePrice = z.infer<typeof ServicePrice>;

export const AccessRequestStatus = z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]);
export type AccessRequestStatus = z.infer<typeof AccessRequestStatus>;

export const ACCESS_REQUEST_STATUS_LABELS: Record<AccessRequestStatus, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvée",
  REJECTED: "Refusée",
  CANCELLED: "Annulée",
};

/** Demande d'activation soumise par une organisation cliente — ne crée jamais d'accès seule. */
export const AccessRequest = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  serviceId: z.string().uuid(),
  requestedByUserId: z.string().uuid(),
  status: AccessRequestStatus,
  message: z.string().optional(),
  adminDecisionByUserId: z.string().uuid().optional(),
  adminDecisionAt: z.string().datetime().optional(),
  adminNote: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type AccessRequest = z.infer<typeof AccessRequest>;

export const EntitlementStatus = z.enum(["ACTIVE", "SUSPENDED", "EXPIRED", "REVOKED"]);
export type EntitlementStatus = z.infer<typeof EntitlementStatus>;

export const ENTITLEMENT_STATUS_LABELS: Record<EntitlementStatus, string> = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  EXPIRED: "Expiré",
  REVOKED: "Révoqué",
};

/**
 * Accès effectif courant d'une organisation à un service — une ligne par (organizationId,
 * serviceId). L'autorisation (cette table) est distincte de la facturation (hors Phase A).
 * `expiresAt` null = sans échéance. Un accès expiré doit être traité comme inactif même si la
 * colonne status n'a pas encore été rafraîchie par une tâche planifiée — voir has_entitlement()
 * côté base, qui est la fonction réutilisable faisant foi pour toute vérification d'accès.
 */
export const OrganizationEntitlement = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  serviceId: z.string().uuid(),
  status: EntitlementStatus,
  priceId: z.string().uuid().optional(),
  grantedByUserId: z.string().uuid(),
  grantedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  revokedAt: z.string().datetime().optional(),
  revokedByUserId: z.string().uuid().optional(),
  revokeReason: z.string().optional(),
  sourceAccessRequestId: z.string().uuid().optional(),
  notes: z.string().optional(),
  /**
   * Quota générique optionnel (ex: nombre de fiches annuaire consultées par mois civil) —
   * `undefined` = sans limite. Réutilisable par tout service à consommation mesurée, pas
   * spécifique à l'annuaire BTP. Voir `has_valid_subcontractor_agreement`-style enforcement :
   * toujours vérifié côté fonction SQL, jamais seulement côté UI.
   */
  accessQuota: z.number().int().positive().optional(),
  updatedAt: z.string().datetime(),
});
export type OrganizationEntitlement = z.infer<typeof OrganizationEntitlement>;

export const EntitlementAction = z.enum(["GRANT", "SUSPEND", "REACTIVATE", "EXTEND", "REVOKE"]);
export type EntitlementAction = z.infer<typeof EntitlementAction>;

export const ENTITLEMENT_ACTION_LABELS: Record<EntitlementAction, string> = {
  GRANT: "Octroyé",
  SUSPEND: "Suspendu",
  REACTIVATE: "Réactivé",
  EXTEND: "Prolongé",
  REVOKE: "Révoqué",
};

/** Historique immuable (append-only) de chaque changement d'état d'un entitlement. */
export const EntitlementGrant = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  serviceId: z.string().uuid(),
  action: EntitlementAction,
  performedByUserId: z.string().uuid(),
  performedAt: z.string().datetime(),
  previousStatus: EntitlementStatus.optional(),
  newStatus: EntitlementStatus,
  expiresAt: z.string().datetime().optional(),
  note: z.string().optional(),
});
export type EntitlementGrant = z.infer<typeof EntitlementGrant>;
