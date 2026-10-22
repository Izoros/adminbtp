import { z } from "zod";

/**
 * Rôle métier d'une organisation sur un chantier donné.
 * Une même organisation peut avoir des rôles différents sur des chantiers différents
 * (ex: Entreprise X est "Entreprise générale" sur le chantier A et "Sous-traitant" sur le chantier B).
 * Ne JAMAIS modéliser ces profils comme des systèmes indépendants : ils partagent le même
 * moteur de phases/documents/validations, configuré par mission (cf. phase.ts).
 */
export const MissionRole = z.enum([
  "MOA", // Maîtrise d'ouvrage
  "MOE", // Maîtrise d'œuvre
  "AMO", // Assistance à maîtrise d'ouvrage
  "OPC", // Ordonnancement, pilotage, coordination
  "BET", // Bureau d'études techniques
  "ENTREPRISE_TCE", // Entreprise tous corps d'état
  "ENTREPRISE_GENERALE",
  "ENTREPRISE_LOT", // Entreprise spécialisée par lot
  "SOUS_TRAITANT",
  "PROMOTEUR",
  "BAILLEUR_SOCIAL",
  "COLLECTIVITE",
]);
export type MissionRole = z.infer<typeof MissionRole>;

export const MISSION_ROLE_LABELS: Record<MissionRole, string> = {
  MOA: "Maîtrise d'ouvrage",
  MOE: "Maîtrise d'œuvre",
  AMO: "Assistance à maîtrise d'ouvrage",
  OPC: "Ordonnancement, pilotage et coordination",
  BET: "Bureau d'études techniques",
  ENTREPRISE_TCE: "Entreprise tous corps d'état",
  ENTREPRISE_GENERALE: "Entreprise générale",
  ENTREPRISE_LOT: "Entreprise spécialisée par lot",
  SOUS_TRAITANT: "Sous-traitant",
  PROMOTEUR: "Promoteur",
  BAILLEUR_SOCIAL: "Bailleur social",
  COLLECTIVITE: "Collectivité",
};

/**
 * Permission informatique d'un utilisateur — distincte du rôle métier ci-dessus.
 * Un "Gestionnaire administratif" (permission) peut intervenir sur des chantiers où
 * son organisation porte le rôle métier "MOE" sur l'un et "Entreprise générale" sur l'autre.
 */
export const UserPermissionRole = z.enum([
  "ADMIN_PLATEFORME",
  "RESPONSABLE_PORTEFEUILLE",
  "GESTIONNAIRE_ADMINISTRATIF",
  "CHARGE_AFFAIRES",
  "ASSISTANT_ADMINISTRATIF",
  "EXPERT_TECHNIQUE",
  "VALIDATEUR",
  "DIRIGEANT_CLIENT",
  "COLLABORATEUR_CLIENT",
  "OBSERVATEUR",
]);
export type UserPermissionRole = z.infer<typeof UserPermissionRole>;

export const USER_PERMISSION_LABELS: Record<UserPermissionRole, string> = {
  ADMIN_PLATEFORME: "Administrateur plateforme",
  RESPONSABLE_PORTEFEUILLE: "Responsable de portefeuille",
  GESTIONNAIRE_ADMINISTRATIF: "Gestionnaire administratif",
  CHARGE_AFFAIRES: "Chargé d'affaires",
  ASSISTANT_ADMINISTRATIF: "Assistant administratif",
  EXPERT_TECHNIQUE: "Expert technique",
  VALIDATEUR: "Validateur",
  DIRIGEANT_CLIENT: "Dirigeant client",
  COLLABORATEUR_CLIENT: "Collaborateur client",
  OBSERVATEUR: "Observateur",
};

/**
 * Distinction explicite, au niveau schéma, entre un collaborateur AdminBTP (la plateforme SaaS
 * elle-même, sans organisation cliente) et un utilisateur d'une entreprise cliente. AdminBTP est
 * un éditeur SaaS multi-tenant : aucune entreprise cliente (MAWU comprise) n'a de statut
 * particulier — voir docs/CDC/MULTI_TENANT_SAAS.md. `PLATEFORME` implique organizationId null ;
 * `ENTREPRISE` implique un organizationId renseigné.
 */
export const RoleScope = z.enum(["PLATEFORME", "ENTREPRISE"]);
export type RoleScope = z.infer<typeof RoleScope>;

export const ROLE_SCOPE_LABELS: Record<RoleScope, string> = {
  PLATEFORME: "Plateforme AdminBTP",
  ENTREPRISE: "Entreprise cliente",
};

/**
 * Forme juridique/métier d'une organisation cliente — configure les valeurs par défaut proposées
 * à l'onboarding (modèles, lots, rôle chantier pré-rempli), ne crée aucun droit. Le rôle effectif
 * sur un chantier donné reste toujours `site_participants.missionRole`.
 */
export const LegalKind = z.enum([
  "ENTREPRISE",
  "MOE",
  "BET",
  "AMO_OPC",
  "PROMOTEUR",
  "BAILLEUR",
  "COLLECTIVITE",
  "ARTISAN",
  "GROUPE",
]);
export type LegalKind = z.infer<typeof LegalKind>;

export const LEGAL_KIND_LABELS: Record<LegalKind, string> = {
  ENTREPRISE: "Entreprise",
  MOE: "Maîtrise d'œuvre",
  BET: "Bureau d'études techniques",
  AMO_OPC: "AMO / OPC",
  PROMOTEUR: "Promoteur",
  BAILLEUR: "Bailleur",
  COLLECTIVITE: "Collectivité",
  ARTISAN: "Artisan",
  GROUPE: "Groupe",
};

export const OrganizationSizeBand = z.enum(["TPE", "PME", "ETI"]);
export type OrganizationSizeBand = z.infer<typeof OrganizationSizeBand>;

export const ORGANIZATION_SIZE_BAND_LABELS: Record<OrganizationSizeBand, string> = {
  TPE: "Très petite entreprise",
  PME: "Petite ou moyenne entreprise",
  ETI: "Entreprise de taille intermédiaire",
};

/**
 * Profil durable d'une organisation — sert de défaut à l'onboarding et au pré-filtre des modèles
 * et lots proposés. Ne crée jamais de droit d'accès : le `MissionRole` effectif sur un chantier
 * (`site_participants.missionRole`) prime toujours sur `defaultMissionRoles`.
 */
export const OrganizationProfile = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  legalKind: LegalKind,
  defaultMissionRoles: z.array(MissionRole).default([]),
  sizeBand: OrganizationSizeBand.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type OrganizationProfile = z.infer<typeof OrganizationProfile>;

/** Quel role_scope chaque UserPermissionRole suppose — utilisé pour valider la cohérence. */
export const PERMISSION_ROLE_SCOPE: Record<UserPermissionRole, RoleScope> = {
  ADMIN_PLATEFORME: "PLATEFORME",
  RESPONSABLE_PORTEFEUILLE: "PLATEFORME",
  GESTIONNAIRE_ADMINISTRATIF: "PLATEFORME",
  CHARGE_AFFAIRES: "PLATEFORME",
  ASSISTANT_ADMINISTRATIF: "PLATEFORME",
  EXPERT_TECHNIQUE: "PLATEFORME",
  VALIDATEUR: "ENTREPRISE",
  DIRIGEANT_CLIENT: "ENTREPRISE",
  COLLABORATEUR_CLIENT: "ENTREPRISE",
  OBSERVATEUR: "ENTREPRISE",
};
