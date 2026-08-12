import { createHmac, timingSafeEqual } from "node:crypto";

const META_SIGNATURE_PREFIX = "sha256=";

function normalizeSecret(value: string | undefined) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}
function safeTextEqual(expected: string, provided: string | null) {
  if (!provided) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(provided, "utf8");

  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}

export function normalizeE164PhoneNumber(value: string) {
  const digits = value.trim().replace(/[^0-9]/g, "");

  if (!/^[1-9][0-9]{6,14}$/.test(digits)) {
    return null;
  }

  return `+${digits}`;
}

export function readWhatsAppGatewayConfig() {
  const allowedSenders = new Set(
    (process.env.ADMINBTP_WHATSAPP_ALLOWED_SENDERS ?? "")
      .split(",")
      .map(normalizeE164PhoneNumber)
      .filter((value): value is string => Boolean(value)),
  );

  return {
    enabled:
      process.env.ADMINBTP_WHATSAPP_COMMANDS_ENABLED?.trim().toLowerCase() ===
      "true",
    appSecret: normalizeSecret(process.env.ADMINBTP_WHATSAPP_APP_SECRET),
    verifyToken: normalizeSecret(
      process.env.ADMINBTP_WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    ),
    allowedSenders,
  };
}

export function hasMatchingVerificationToken(
  expectedToken: string,
  providedToken: string | null,
) {
  return safeTextEqual(expectedToken, providedToken);
}

export function hasValidMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
) {
  if (!signatureHeader?.startsWith(META_SIGNATURE_PREFIX)) {
    return false;
  }

  const providedDigest = signatureHeader.slice(META_SIGNATURE_PREFIX.length);

  if (!/^[a-f0-9]{64}$/i.test(providedDigest)) {
    return false;
  }

  const expectedDigest = createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  return safeTextEqual(expectedDigest, providedDigest.toLowerCase());
}

export function createSenderFingerprint(senderPhone: string, appSecret: string) {
  return createHmac("sha256", appSecret)
    .update(senderPhone, "utf8")
    .digest("hex");
}
