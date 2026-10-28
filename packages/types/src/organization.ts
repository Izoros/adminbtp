import { z } from "zod";

export const SubscriptionPlan = z.enum(["DEMO", "STARTER", "PRO", "ENTERPRISE"]);
export type SubscriptionPlan = z.infer<typeof SubscriptionPlan>;

/**
 * Société cliente d'AdminBTP (tenant). Toutes les données métier sont rattachées
 * à une organizationId et isolées via RLS (voir database/policies). AdminBTP est un SaaS
 * multi-tenant : aucune organisation (MAWU comprise) n'a de statut particulier — voir
 * docs/CDC/MULTI_TENANT_SAAS.md.
 */
export const Organization = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  legalName: z.string().min(1),
  siret: z.string().length(14).optional(),
  logoUrl: z.string().url().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default("FR"),
  domain: z.string().optional(), // domaine mail principal (ex: societe.yt) — voir OrganizationDomain pour la liste complète
  domainVerified: z.boolean().default(false),
  subscriptionPlan: SubscriptionPlan.default("DEMO"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Organization = z.infer<typeof Organization>;

/** Domaine mail supplémentaire d'une organisation (une organisation peut en avoir plusieurs). */
export const OrganizationDomain = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  domain: z.string().min(1),
  isVerified: z.boolean().default(false),
  createdAt: z.string().datetime(),
});
export type OrganizationDomain = z.infer<typeof OrganizationDomain>;

/**
 * Collaborateur AdminBTP autorisé à superviser un portefeuille de sociétés clientes
 * (plusieurs organisations, plusieurs chantiers), distinct des comptes "client". La délégation
 * est explicite et révocable — un grant révoqué (revokedAt renseigné) n'ouvre plus aucun accès,
 * mais reste visible pour la traçabilité (jamais supprimé).
 */
export const PortfolioGrant = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  grantedBy: z.string().uuid(),
  grantedAt: z.string().datetime(),
  revokedAt: z.string().datetime().optional(),
  revokedBy: z.string().uuid().optional(),
});
export type PortfolioGrant = z.infer<typeof PortfolioGrant>;

/** Fonctionnalité activée ou non pour un plan d'abonnement donné (paramétrage par abonnement). */
export const PlanFeature = z.object({
  plan: SubscriptionPlan,
  featureKey: z.string().min(1), // ex: "odoo_integration", "multi_site_collaboration"
  enabled: z.boolean().default(true),
});
export type PlanFeature = z.infer<typeof PlanFeature>;

export const IntegrationType = z.enum(["ODOO", "N8N", "EMAIL", "WHATSAPP", "AI"]);
export type IntegrationType = z.infer<typeof IntegrationType>;

export const INTEGRATION_TYPE_LABELS: Record<IntegrationType, string> = {
  ODOO: "Odoo",
  N8N: "n8n (automatisations)",
  EMAIL: "Email (boîtes génériques)",
  WHATSAPP: "WhatsApp Business",
  AI: "IA (génération de documents)",
};

/**
 * Qui opère l'intégration pour cette organisation : AdminBTP par défaut, ou l'entreprise cliente
 * elle-même si elle gère sa propre instance (ex: Odoo déjà déployé en interne). Permet de changer
 * de mode sans migration de schéma.
 */
export const IntegrationManagedBy = z.enum(["ADMINBTP", "CLIENT"]);
export type IntegrationManagedBy = z.infer<typeof IntegrationManagedBy>;

export const INTEGRATION_MANAGED_BY_LABELS: Record<IntegrationManagedBy, string> = {
  ADMINBTP: "Géré par AdminBTP",
  CLIENT: "Géré par l'entreprise cliente",
};

/**
 * Connecteur externe isolé par organisation (Odoo, n8n...). Ne stocke que de la configuration
 * non sensible (URL, identifiants d'instance) — les secrets réels (clés API) passent par un
 * coffre-fort dédié, jamais par cette table. Voir docs/CDC/MULTI_TENANT_SAAS.md.
 */
export const OrganizationIntegration = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  integrationType: IntegrationType,
  managedBy: IntegrationManagedBy.default("ADMINBTP"),
  config: z.record(z.string(), z.unknown()).default({}),
  isActive: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type OrganizationIntegration = z.infer<typeof OrganizationIntegration>;

/** Configuration de signature propre à une organisation (modèles documentaires et signatures
 * spécifiques par entreprise). whatsappEnabled n'autorise qu'une preuve d'échange WhatsApp —
 * jamais une signature électronique à elle seule, voir ValidationRecord. */
export const SignatureProfile = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  label: z.string().min(1),
  signerName: z.string().min(1),
  signerRole: z.string().min(1),
  signatureStyle: z.string().min(1),
  whatsappEnabled: z.boolean().default(false),
  createdByUserId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type SignatureProfile = z.infer<typeof SignatureProfile>;
