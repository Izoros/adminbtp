import { z } from "zod";

/**
 * Annuaire professionnel BTP — Phase B du module Marketplace (voir
 * docs/MONETIZATION_AND_ENTITLEMENTS.md). Catalogue partagé (pas de tenant), accès gouverné par
 * les entitlements déjà posés en Phase A (`directory.btp`, `directory.bet`, `directory.suppliers`)
 * via `directoryCategory.serviceCode`. Aucune donnée protégée n'est jamais exposée côté UI sans
 * vérification côté base — voir `has_any_accessible_entitlement()` et `record_directory_access()`.
 */
export const DirectoryCategory = z.object({
  id: z.string().uuid(),
  code: z.string().min(1), // ex: "ENTREPRISE_BTP", "BET", "FOURNISSEUR"
  label: z.string().min(1),
  serviceCode: z.string().min(1), // ex: "directory.btp" — référence service_catalog.code
});
export type DirectoryCategory = z.infer<typeof DirectoryCategory>;

/** Origine d'un lot de fiches (import CSV ou saisie manuelle) — traçabilité de l'import. */
export const DirectorySource = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  importedByUserId: z.string().uuid(),
  importedAt: z.string().datetime(),
  createdCount: z.number().int().nonnegative().default(0),
  skippedCount: z.number().int().nonnegative().default(0),
  errorCount: z.number().int().nonnegative().default(0),
});
export type DirectorySource = z.infer<typeof DirectorySource>;

/**
 * Fiche société/professionnel. `siret` sert de clé de déduplication prioritaire à l'import (à
 * défaut, `name` + `postalCode`) — voir `importDirectoryCsv` côté actions.
 */
export const DirectoryCompany = z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string().min(1),
  siret: z.string().optional(),
  tradeCodeId: z.string().uuid().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
  sourceId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type DirectoryCompany = z.infer<typeof DirectoryCompany>;

export const DirectoryContact = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  fullName: z.string().min(1),
  role: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  isPrimary: z.boolean().default(false),
});
export type DirectoryContact = z.infer<typeof DirectoryContact>;

/**
 * Historique des consultations de fiche — sert à la fois d'audit et de base de calcul du quota
 * mensuel (`organizationEntitlement.accessQuota`, voir entitlements.ts). Une même fiche déjà
 * consultée ce mois-ci ne recompte pas dans le quota (voir `record_directory_access()`).
 */
export const DirectoryAccessLog = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  companyId: z.string().uuid(),
  accessedByUserId: z.string().uuid(),
  accessedAt: z.string().datetime(),
});
export type DirectoryAccessLog = z.infer<typeof DirectoryAccessLog>;
