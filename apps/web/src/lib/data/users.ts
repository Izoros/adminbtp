import { createClient } from "@/lib/supabase/server";
import type { UserPermissionRole } from "@adminbtp/types";

export interface PlatformUser {
  id: string;
  fullName: string;
  permissionRole: UserPermissionRole;
  initials: string;
}

export interface PortfolioEntry extends PlatformUser {
  organizationIds: string[];
}

function initialsFor(name: string): string {
  const letters = name.match(/\p{L}+/gu) ?? [];
  if (letters.length === 0) return "?";
  if (letters.length === 1) return letters[0]!.slice(0, 2).toUpperCase();
  return (letters[0]![0]! + letters[letters.length - 1]![0]!).toUpperCase();
}

/** Collaborateurs AdminBTP (role_scope = PLATEFORME) — utilisés pour les listes d'assignation. */
export async function getPlatformUsers(): Promise<PlatformUser[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, permission_role")
    .eq("role_scope", "PLATEFORME")
    .order("full_name");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    permissionRole: row.permission_role,
    initials: initialsFor(row.full_name),
  }));
}

/** Portefeuille de chaque collaborateur AdminBTP : organisations supervisées via portfolio_grants
 * non révoqués — voir docs/CDC/MULTI_TENANT_SAAS.md. */
export async function getPortfolio(): Promise<PortfolioEntry[]> {
  const supabase = await createClient();
  const [usersResult, grantsResult] = await Promise.all([
    getPlatformUsers(),
    supabase.from("portfolio_grants").select("user_id, organization_id, revoked_at"),
  ]);
  if (grantsResult.error) throw grantsResult.error;

  const grantsByUser = new Map<string, string[]>();
  for (const grant of grantsResult.data ?? []) {
    if (grant.revoked_at) continue;
    const list = grantsByUser.get(grant.user_id) ?? [];
    list.push(grant.organization_id);
    grantsByUser.set(grant.user_id, list);
  }

  return usersResult.map((user) => ({
    ...user,
    organizationIds: grantsByUser.get(user.id) ?? [],
  }));
}

/** Nom d'un utilisateur, ou `undefined` si la RLS de `users` le masque au lecteur. */
export async function getUserFullName(userId: string): Promise<string | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("users").select("full_name").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data?.full_name ?? undefined;
}
