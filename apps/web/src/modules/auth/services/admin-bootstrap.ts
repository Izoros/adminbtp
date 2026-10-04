import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Emails promus automatiquement platform_admin a la connexion.
// Permet d'ouvrir le premier compte admin sans script ni SQL.
export function getBootstrapAdminEmails(
  rawValue = process.env.ADMINBTP_PLATFORM_ADMIN_EMAILS,
) {
  return new Set(
    (rawValue ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isBootstrapAdminEmail(email: string | null | undefined) {
  return Boolean(email) && getBootstrapAdminEmails().has(email!.trim().toLowerCase());
}

export type BootstrapAdminResult =
  | "not_listed"
  | "promoted"
  | "missing_service_key"
  | "failed";

export async function ensureBootstrapAdmin(user: {
  id: string;
  email?: string | null;
}): Promise<BootstrapAdminResult> {
  if (!isBootstrapAdminEmail(user.email)) {
    return "not_listed";
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    console.warn("[AdminBTP][auth] bootstrap_admin_skipped", {
      reason: "missing_service_key",
    });
    return "missing_service_key";
  }

  const { error } = await admin.from("user_profiles").upsert(
    {
      id: user.id,
      email: user.email!.trim().toLowerCase(),
      internal_role: "platform_admin",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    console.error("[AdminBTP][auth] bootstrap_admin_failed", { code: error.code });
    return "failed";
  }

  return "promoted";
}
