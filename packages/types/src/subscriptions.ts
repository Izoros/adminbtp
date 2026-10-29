import { z } from "zod";

/**
 * Module abonnements & crédits — marketplace de fonctionnalités, Phase D.
 * Voir docs/MONETIZATION_AND_ENTITLEMENTS.md et docs/ROADMAP.md ("Phase D — Abonnements et
 * crédits") pour les règles produit complètes. Complète ./entitlements.ts (Phase A) sans le
 * modifier : un abonnement réutilise le même catalogue/prix versionné (ServiceCatalogItem,
 * ServicePrice) plutôt que de dupliquer une notion de "plan".
 *
 * Règle non négociable : seul un utilisateur ADMIN_PLATEFORME ("Super Administrateur") peut
 * activer, suspendre, réactiver, prolonger ou annuler un abonnement, ou créditer un portefeuille
 * de crédits — jamais via une écriture directe, uniquement via les fonctions SECURITY DEFINER
 * décrites dans database/migrations/0048_phase_d_subscription_lifecycle_functions.sql et
 * 0049_phase_d_credit_engine_functions.sql. Le débit de crédits lors d'une consommation (appel
 * IA, génération de document...) n'est pas soumis à cette règle : il est déclenché par tout
 * membre de l'organisation qui utilise une fonctionnalité payante déjà accordée, mais reste lui
 * aussi exclusivement exprimé via une fonction SECURITY DEFINER dédiée (debit_credits/
 * record_usage) pour garantir qu'un débit et son enregistrement dans l'historique ne soient
 * jamais l'un sans l'autre, et qu'un retry réseau ne débite jamais deux fois (clé d'idempotence).
 */

export const SubscriptionStatus = z.enum(["ACTIVE", "SUSPENDED", "EXPIRED", "CANCELLED"]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatus>;

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  EXPIRED: "Expiré",
  CANCELLED: "Annulé",
};

export const SubscriptionAction = z.enum(["ACTIVATE", "SUSPEND", "REACTIVATE", "EXTEND", "CANCEL"]);
export type SubscriptionAction = z.infer<typeof SubscriptionAction>;

export const SUBSCRIPTION_ACTION_LABELS: Record<SubscriptionAction, string> = {
  ACTIVATE: "Activé",
  SUSPEND: "Suspendu",
  REACTIVATE: "Réactivé",
  EXTEND: "Prolongé",
  CANCEL: "Annulé",
};

/**
 * Abonnement effectif courant d'une organisation à un service — une ligne par (organizationId,
 * serviceId), même esprit que OrganizationEntitlement en Phase A mais avec des dates de période
 * de facturation. `expiresAt` null = sans échéance. Un abonnement expiré doit être traité comme
 * inactif même si `status` n'a pas encore été rafraîchi par une tâche planifiée — voir
 * `is_subscription_active()` côté base, qui fait foi pour toute vérification d'accès.
 */
export const OrganizationSubscription = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  serviceId: z.string().uuid(),
  status: SubscriptionStatus,
  priceId: z.string().uuid().optional(),
  activatedByUserId: z.string().uuid(),
  activatedAt: z.string().datetime(),
  currentPeriodStart: z.string().datetime().optional(),
  currentPeriodEnd: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  cancelledAt: z.string().datetime().optional(),
  cancelledByUserId: z.string().uuid().optional(),
  cancelReason: z.string().optional(),
  notes: z.string().optional(),
  updatedAt: z.string().datetime(),
});
export type OrganizationSubscription = z.infer<typeof OrganizationSubscription>;

/**
 * Portefeuille de crédits prépayés — un solde par organisation, jamais négatif (contrainte base
 * + contrôle applicatif de debit_credits()). `expiresAt` null = sans échéance ; des crédits
 * promotionnels peuvent avoir une échéance, au-delà de laquelle toute consommation est refusée
 * même si `balance` est encore positif.
 */
export const CreditWallet = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  balance: z.number().int().nonnegative(),
  expiresAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type CreditWallet = z.infer<typeof CreditWallet>;

export const CreditTransactionType = z.enum(["TOPUP", "DEBIT", "ADJUSTMENT", "REFUND"]);
export type CreditTransactionType = z.infer<typeof CreditTransactionType>;

export const CREDIT_TRANSACTION_TYPE_LABELS: Record<CreditTransactionType, string> = {
  TOPUP: "Ajout",
  DEBIT: "Débit",
  ADJUSTMENT: "Ajustement",
  REFUND: "Remboursement",
};

/**
 * Historique immuable (append-only, jamais UPDATE/DELETE pour un rôle applicatif standard — voir
 * AuditLogEntry) de chaque mouvement de crédit. `amount` est signé : positif pour un ajout
 * (TOPUP/REFUND/ADJUSTMENT positif), négatif pour un débit de consommation. `balanceAfter` fige
 * le solde résultant pour un affichage d'historique sans recalcul. `idempotencyKey` garantit
 * qu'un retry réseau sur la même opération ne produit jamais une deuxième ligne ici.
 */
export const CreditTransaction = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  walletId: z.string().uuid(),
  transactionType: CreditTransactionType,
  amount: z.number().int(),
  balanceAfter: z.number().int().nonnegative(),
  reason: z.string().min(1),
  usageRecordId: z.string().uuid().optional(),
  idempotencyKey: z.string().optional(),
  performedByUserId: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type CreditTransaction = z.infer<typeof CreditTransaction>;

/**
 * Consommation mesurée (ex: appel IA, génération de document) — ce qui sera débité du
 * portefeuille de crédits. `idempotencyKey` identifie l'opération source de façon unique par
 * organisation : un retry ne crée jamais une deuxième ligne, donc jamais un deuxième débit.
 */
export const UsageRecord = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  serviceId: z.string().uuid().optional(),
  usageType: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  creditsCost: z.number().int().nonnegative(),
  idempotencyKey: z.string().min(1),
  recordedByUserId: z.string().uuid(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().datetime(),
});
export type UsageRecord = z.infer<typeof UsageRecord>;
