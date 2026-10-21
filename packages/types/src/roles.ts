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
