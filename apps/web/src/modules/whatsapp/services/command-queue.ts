import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { WhatsAppCommandCandidate } from "@/modules/whatsapp/types/command";
import type { SupabaseDatabase } from "@/types/supabase";

type WhatsAppCommandInsert =
  SupabaseDatabase["public"]["Tables"]["whatsapp_command_requests"]["Insert"];

export type EnqueueWhatsAppCommandResult =
  | { status: "persisted"; commandId: string }
  | { status: "duplicate" }
  | { status: "unavailable" }
  | { status: "failed" };

export async function enqueueWhatsAppCommand(
  candidate: WhatsAppCommandCandidate,
  senderFingerprint: string,
): Promise<EnqueueWhatsAppCommandResult> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return { status: "unavailable" };
  }

  const insert: WhatsAppCommandInsert = {
    provider_message_id: candidate.providerMessageId,
    business_phone_number_id: candidate.businessPhoneNumberId,
    sender_fingerprint: senderFingerprint,
    command_text: candidate.commandText,
    command_kind: candidate.commandKind,
    status: "pending_review",
    provider_sent_at: candidate.providerSentAt,
  };
  const { data, error } = await supabase
    .from("whatsapp_command_requests")
    .insert(insert)
    .select("id")
    .single();

  if (error?.code === "23505") {
    return { status: "duplicate" };
  }

  if (error || !data) {
    return { status: "failed" };
  }

  return { status: "persisted", commandId: data.id };
}
