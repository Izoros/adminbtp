import { z } from "zod";

/**
 * Société cliente d'AdminBTP (tenant). Toutes les données métier sont rattachées
 * à une organizationId et isolées via RLS (voir database/policies).
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
  domain: z.string().optional(), // nom de domaine mail vérifié (ex: societe.yt)
  domainVerified: z.boolean().default(false),
  subscriptionPlan: z.enum(["DEMO", "STARTER", "PRO", "ENTERPRISE"]).default("DEMO"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Organization = z.infer<typeof Organization>;

/**
 * Collaborateur AdminBTP autorisé à superviser un portefeuille de sociétés clientes
 * (plusieurs organisations, plusieurs chantiers), distinct des comptes "client".
 */
export const PortfolioGrant = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  grantedBy: z.string().uuid(),
  grantedAt: z.string().datetime(),
});
export type PortfolioGrant = z.infer<typeof PortfolioGrant>;
