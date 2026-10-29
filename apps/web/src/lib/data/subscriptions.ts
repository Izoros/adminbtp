import { createClient } from "@/lib/supabase/server";
import type { CreditTransaction, CreditWallet, OrganizationSubscription, UsageRecord } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

/**
 * Lecture Phase D (abonnements et crédits) — voir
 * database/migrations/0046_phase_d_subscriptions_credits_schema.sql. Aucune policy
 * INSERT/UPDATE/DELETE sur ces tables : toute mutation passe par les fonctions SECURITY DEFINER
 * appelées depuis @/lib/actions/subscriptions.
 */

type OrganizationSubscriptionRow = Database["public"]["Tables"]["organization_subscriptions"]["Row"];
type CreditWalletRow = Database["public"]["Tables"]["credit_wallets"]["Row"];
type CreditTransactionRow = Database["public"]["Tables"]["credit_transactions"]["Row"];
type UsageRecordRow = Database["public"]["Tables"]["usage_records"]["Row"];

function mapSubscription(row: OrganizationSubscriptionRow): OrganizationSubscription {
  return {
    id: row.id,
    organizationId: row.organization_id,
    serviceId: row.service_id,
    status: row.status,
    priceId: row.price_id ?? undefined,
    activatedByUserId: row.activated_by_user_id,
    activatedAt: row.activated_at,
    currentPeriodStart: row.current_period_start ?? undefined,
    currentPeriodEnd: row.current_period_end ?? undefined,
    expiresAt: row.expires_at ?? undefined,
    cancelledAt: row.cancelled_at ?? undefined,
    cancelledByUserId: row.cancelled_by_user_id ?? undefined,
    cancelReason: row.cancel_reason ?? undefined,
    notes: row.notes ?? undefined,
    updatedAt: row.updated_at,
  };
}

function mapWallet(row: CreditWalletRow): CreditWallet {
  return {
    id: row.id,
    organizationId: row.organization_id,
    balance: row.balance,
    expiresAt: row.expires_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTransaction(row: CreditTransactionRow): CreditTransaction {
  return {
    id: row.id,
    organizationId: row.organization_id,
    walletId: row.wallet_id,
    transactionType: row.transaction_type,
    amount: row.amount,
    balanceAfter: row.balance_after,
    reason: row.reason,
    usageRecordId: row.usage_record_id ?? undefined,
    idempotencyKey: row.idempotency_key ?? undefined,
    performedByUserId: row.performed_by_user_id,
    createdAt: row.created_at,
  };
}

function mapUsageRecord(row: UsageRecordRow): UsageRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    serviceId: row.service_id ?? undefined,
    usageType: row.usage_type,
    quantity: row.quantity,
    creditsCost: row.credits_cost,
    idempotencyKey: row.idempotency_key,
    recordedByUserId: row.recorded_by_user_id,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
  };
}

/** Vue Super Administrateur : tous les abonnements, toutes organisations confondues. */
export async function getAllOrganizationSubscriptions(): Promise<OrganizationSubscription[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_subscriptions")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapSubscription);
}

export async function getOrganizationSubscriptions(organizationId: string): Promise<OrganizationSubscription[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_subscriptions")
    .select("*")
    .eq("organization_id", organizationId);
  if (error) throw error;
  return (data ?? []).map(mapSubscription);
}

/** Vue Super Administrateur : tous les portefeuilles de crédits, toutes organisations confondues. */
export async function getAllCreditWallets(): Promise<CreditWallet[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("credit_wallets").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapWallet);
}

export async function getCreditWallet(organizationId: string): Promise<CreditWallet | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_wallets")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapWallet(data) : null;
}

/** Historique des mouvements de crédit d'une organisation, le plus récent en premier. */
export async function getCreditTransactions(organizationId: string): Promise<CreditTransaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapTransaction);
}

/** Vue Super Administrateur : historique des mouvements de crédit, toutes organisations confondues. */
export async function getAllCreditTransactions(): Promise<CreditTransaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map(mapTransaction);
}

export async function getUsageRecords(organizationId: string): Promise<UsageRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("usage_records")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapUsageRecord);
}
