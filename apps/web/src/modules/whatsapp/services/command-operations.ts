import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  WhatsAppCommandKind,
  WhatsAppCommandQueueAccessResult,
  WhatsAppCommandQueueData,
  WhatsAppCommandQueueItem,
  WhatsAppCommandStatus,
} from "@/modules/whatsapp/types/command";
import type { SupabaseDatabase } from "@/types/supabase";

type WhatsAppCommandRow =
  SupabaseDatabase["public"]["Tables"]["whatsapp_command_requests"]["Row"];

const COMMAND_HISTORY_LIMIT = 100;

function normalizeCommandKind(value: string): WhatsAppCommandKind {
  if (
    value === "help" ||
    value === "status_check" ||
    value === "archive_status"
  ) {
    return value;
  }

  return "development_request";
}
function normalizeCommandStatus(value: string): WhatsAppCommandStatus {
  if (
    value === "approved" ||
    value === "rejected" ||
    value === "processing" ||
    value === "completed" ||
    value === "failed"
  ) {
    return value;
  }

  return "pending_review";
}

export function mapWhatsAppCommandRow(
  row: WhatsAppCommandRow,
): WhatsAppCommandQueueItem {
  return {
    id: row.id,
    providerMessageId: row.provider_message_id,
    senderFingerprint: row.sender_fingerprint,
    commandText: row.command_text,
    commandKind: normalizeCommandKind(row.command_kind),
    status: normalizeCommandStatus(row.status),
    providerSentAt: row.provider_sent_at,
    receivedAt: row.received_at,
    reviewedAt: row.reviewed_at,
    completedAt: row.completed_at,
    responseSummary: row.response_summary,
    retentionUntil: row.retention_until,
  };
}

export function buildWhatsAppCommandQueueData(
  rows: WhatsAppCommandRow[],
  now = new Date(),
): WhatsAppCommandQueueData {
  const commands = [...rows]
    .sort(
      (firstRow, secondRow) =>
        new Date(secondRow.received_at).getTime() -
        new Date(firstRow.received_at).getTime(),
    )
    .map(mapWhatsAppCommandRow);

  return {
    updatedAt: now.toISOString(),
    sourceMessage:
      commands.length > 0
        ? `${commands.length} demande(s) WhatsApp chargee(s) depuis Supabase.`
        : "La file WhatsApp est accessible mais ne contient encore aucune demande.",
    totalCommands: commands.length,
    pendingCommands: commands.filter(
      (command) => command.status === "pending_review",
    ).length,
    completedCommands: commands.filter(
      (command) => command.status === "completed",
    ).length,
    failedCommands: commands.filter((command) => command.status === "failed")
      .length,
    commands,
  };
}

async function isCurrentUserPlatformAdmin(
  supabase: SupabaseClient<SupabaseDatabase>,
) {
  const { data, error } = await supabase.rpc("is_platform_admin");
  return error ? null : data === true;
}

export async function loadWhatsAppCommandQueue(): Promise<WhatsAppCommandQueueAccessResult> {
  const sessionClient = await createClient();

  if (!sessionClient) {
    return {
      access: "unavailable",
      message: "Configuration Supabase indisponible pour verifier l'acces admin.",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await sessionClient.auth.getUser();

  if (userError || !user) {
    return {
      access: "unauthenticated",
      message: "Une session Supabase est requise pour consulter les commandes WhatsApp.",
    };
  }

  const isPlatformAdmin = await isCurrentUserPlatformAdmin(sessionClient);

  if (isPlatformAdmin === null) {
    return {
      access: "unavailable",
      message: "Le role plateforme n'a pas pu etre verifie.",
    };
  }

  if (!isPlatformAdmin) {
    return {
      access: "forbidden",
      message: "La file WhatsApp est reservee aux administrateurs plateforme.",
    };
  }

  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    return {
      access: "unavailable",
      message: "Le lecteur serveur de la file WhatsApp n'est pas configure.",
    };
  }

  const { data, error } = await adminClient
    .from("whatsapp_command_requests")
    .select("*")
    .order("received_at", { ascending: false })
    .limit(COMMAND_HISTORY_LIMIT);

  if (error) {
    return {
      access: "unavailable",
      message: "La file de commandes WhatsApp n'a pas pu etre chargee.",
    };
  }

  return {
    access: "ready",
    data: buildWhatsAppCommandQueueData(data ?? []),
  };
}
