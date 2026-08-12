import type {
  WhatsAppCommandCandidate,
  WhatsAppCommandKind,
} from "@/modules/whatsapp/types/command";
import { normalizeE164PhoneNumber } from "@/modules/whatsapp/services/webhook-security";

const MAX_COMMAND_LENGTH = 2_000;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function asRecordArray(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function normalizeCommandText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function classifyWhatsAppCommand(commandText: string): WhatsAppCommandKind {
  const normalized = normalizeCommandText(commandText)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (/^(aide|help)(\s|$)/.test(normalized)) {
    return "help";
  }

  if (/^(status|statut|etat|sante)(\s|$)/.test(normalized)) {
    return "status_check";
  }

  if (/^(archive|archives|sauvegarde|sauvegardes)(\s|$)/.test(normalized)) {
    return "archive_status";
  }

  return "development_request";
}

function parseProviderSentAt(value: unknown) {
  if (typeof value !== "string" || !/^\d{1,13}$/.test(value)) {
    return null;
  }

  const timestamp = Number(value);
  const date = new Date(timestamp * 1_000);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function extractWhatsAppCommandCandidates(
  payload: unknown,
): WhatsAppCommandCandidate[] {
  if (!isRecord(payload) || payload.object !== "whatsapp_business_account") {
    return [];
  }

  const candidates: WhatsAppCommandCandidate[] = [];

  for (const entry of asRecordArray(payload.entry)) {
    for (const change of asRecordArray(entry.changes)) {
      if (!isRecord(change.value)) {
        continue;
      }

      const metadata = isRecord(change.value.metadata)
        ? change.value.metadata
        : null;
      const businessPhoneNumberId = metadata?.phone_number_id;

      if (
        typeof businessPhoneNumberId !== "string" ||
        businessPhoneNumberId.length === 0 ||
        businessPhoneNumberId.length > 128
      ) {
        continue;
      }

      for (const message of asRecordArray(change.value.messages)) {
        if (message.type !== "text" || !isRecord(message.text)) {
          continue;
        }

        const senderPhone =
          typeof message.from === "string"
            ? normalizeE164PhoneNumber(message.from)
            : null;
        const providerMessageId = message.id;
        const rawCommandText = message.text.body;

        if (
          !senderPhone ||
          typeof providerMessageId !== "string" ||
          providerMessageId.length === 0 ||
          providerMessageId.length > 512 ||
          typeof rawCommandText !== "string"
        ) {
          continue;
        }

        const commandText = normalizeCommandText(rawCommandText);

        if (
          commandText.length === 0 ||
          commandText.length > MAX_COMMAND_LENGTH
        ) {
          continue;
        }

        candidates.push({
          providerMessageId,
          businessPhoneNumberId,
          senderPhone,
          commandText,
          commandKind: classifyWhatsAppCommand(commandText),
          providerSentAt: parseProviderSentAt(message.timestamp),
        });
      }
    }
  }

  return candidates;
}
