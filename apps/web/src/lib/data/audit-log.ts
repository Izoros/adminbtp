import { createClient } from "@/lib/supabase/server";
import type { AuditLogEntry } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type AuditLogRow = Database["public"]["Tables"]["audit_log"]["Row"];

/**
 * Journal d'audit (conformité RGPD / preuve, cf. docs/ROADMAP.md Phase 9) — table append-only,
 * voir database/migrations/0001_init_core_schema.sql. Aucune policy INSERT/UPDATE/DELETE
 * applicative : seules les fonctions serveur (clé service) y écrivent. La policy
 * `audit_log_select` (database/policies/0001_rls_policies.sql, can_access_organization) filtre
 * déjà aux organisations accessibles à l'utilisateur courant : pas besoin d'une fonction
 * SECURITY DEFINER dédiée pour la pagination/le filtrage ci-dessous.
 */

export const AUDIT_LOG_PAGE_SIZE = 50;

export interface AuditLogFilters {
  /** Organisation sélectionnée dans le filtre — ignoré si l'utilisateur n'en voit qu'une. */
  organizationId?: string;
  /** Type d'action exact (ex: "document.validate") — voir getAuditLogActionTypes(). */
  action?: string;
  /** Date de début (incluse), format "YYYY-MM-DD". */
  dateFrom?: string;
  /** Date de fin (incluse), format "YYYY-MM-DD". */
  dateTo?: string;
  /** Page 1-based. */
  page?: number;
}

export interface AuditLogPage {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

function mapAuditLogEntry(row: AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    organizationId: row.organization_id,
    actorUserId: row.actor_user_id,
    actorType: row.actor_type,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
  };
}

/** Liste paginée et filtrée du journal d'audit, pour l'écran /audit. */
export async function getAuditLogEntries(filters: AuditLogFilters = {}): Promise<AuditLogPage> {
  const supabase = await createClient();
  const pageSize = AUDIT_LOG_PAGE_SIZE;
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.organizationId) query = query.eq("organization_id", filters.organizationId);
  if (filters.action) query = query.eq("action", filters.action);
  if (filters.dateFrom) query = query.gte("created_at", `${filters.dateFrom}T00:00:00.000Z`);
  if (filters.dateTo) query = query.lte("created_at", `${filters.dateTo}T23:59:59.999Z`);

  const { data, error, count } = await query;
  if (error) throw error;

  const total = count ?? 0;
  return {
    entries: (data ?? []).map(mapAuditLogEntry),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/**
 * Types d'actions déjà journalisés (organisations accessibles uniquement, via RLS), pour peupler
 * le filtre "action" sans dupliquer une liste statique qui se désynchroniserait des Server
 * Actions existantes (grant_entitlement, document.validate, credit.topup, etc.).
 */
export async function getAuditLogActionTypes(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("audit_log").select("action").limit(10000);
  if (error) throw error;
  return Array.from(new Set((data ?? []).map((row) => row.action))).sort();
}
