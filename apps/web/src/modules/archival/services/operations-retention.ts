import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type OperationsRetentionResult = {
  purgedAt: string;
  deletedWhatsAppCommands: number;
  deletedOperationsAlerts: number;
};

function readCount(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : 0;
}

export function parseOperationsRetentionResult(
  value: unknown,
  fallbackPurgedAt: string,
): OperationsRetentionResult {
  const payload =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return {
    purgedAt:
      typeof payload.purged_at === "string"
        ? payload.purged_at
        : fallbackPurgedAt,
    deletedWhatsAppCommands: readCount(
      payload.deleted_whatsapp_commands,
    ),
    deletedOperationsAlerts: readCount(payload.deleted_operations_alerts),
  };
}

export async function runOperationsRetentionCleanup(options?: {
  now?: Date;
  adminClient?: NonNullable<ReturnType<typeof createSupabaseAdminClient>>;
}): Promise<OperationsRetentionResult> {
  const now = options?.now ?? new Date();
  const targetNow = now.toISOString();
  const supabase = options?.adminClient ?? createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase admin indisponible pour appliquer la retention.");
  }

  const { data, error } = await supabase.rpc("purge_expired_operations_data", {
    target_now: targetNow,
  });

  if (error) {
    throw new Error("La purge des donnees d'exploitation a echoue.");
  }

  return parseOperationsRetentionResult(data, targetNow);
}
