import { NextResponse } from "next/server";

import { enqueueWhatsAppCommand } from "@/modules/whatsapp/services/command-queue";
import {
  createSenderFingerprint,
  hasMatchingVerificationToken,
  hasValidMetaSignature,
  readWhatsAppGatewayConfig,
} from "@/modules/whatsapp/services/webhook-security";
import { extractWhatsAppCommandCandidates } from "@/modules/whatsapp/services/webhook-payload";

export const runtime = "nodejs";

const MAX_WEBHOOK_BYTES = 256 * 1_024;

function jsonError(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}
function hasJsonContentType(request: Request) {
  const contentType = request.headers.get("content-type");
  return contentType?.split(";")[0]?.trim().toLowerCase() === "application/json";
}

async function readBoundedBody(request: Request) {
  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader
    ? Number.parseInt(contentLengthHeader, 10)
    : null;

  if (
    contentLength !== null &&
    Number.isFinite(contentLength) &&
    contentLength > MAX_WEBHOOK_BYTES
  ) {
    return { success: false as const };
  }

  const rawBody = await request.text();

  if (Buffer.byteLength(rawBody, "utf8") > MAX_WEBHOOK_BYTES) {
    return { success: false as const };
  }

  return { success: true as const, rawBody };
}

export async function GET(request: Request) {
  const config = readWhatsAppGatewayConfig();

  if (!config.verifyToken) {
    return jsonError(503, "Webhook WhatsApp non configure.");
  }

  const searchParams = new URL(request.url).searchParams;
  const mode = searchParams.get("hub.mode");
  const providedToken = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode !== "subscribe" ||
    !challenge ||
    !hasMatchingVerificationToken(config.verifyToken, providedToken)
  ) {
    return jsonError(403, "Verification WhatsApp refusee.");
  }

  return new Response(challenge, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export async function POST(request: Request) {
  if (!hasJsonContentType(request)) {
    return jsonError(415, "Le content-type doit etre application/json.");
  }

  const bodyResult = await readBoundedBody(request);

  if (!bodyResult.success) {
    return jsonError(413, "Le payload WhatsApp depasse la taille autorisee.");
  }

  const config = readWhatsAppGatewayConfig();

  if (!config.appSecret) {
    return jsonError(503, "Signature WhatsApp non configuree.");
  }

  if (
    !hasValidMetaSignature(
      bodyResult.rawBody,
      request.headers.get("x-hub-signature-256"),
      config.appSecret,
    )
  ) {
    return jsonError(401, "Signature WhatsApp invalide.");
  }

  if (!config.enabled) {
    return NextResponse.json({
      ok: true,
      gateway: "disabled",
      accepted: 0,
      duplicate: 0,
      ignored: 0,
    });
  }

  if (config.allowedSenders.size === 0) {
    return jsonError(503, "Aucun expediteur WhatsApp autorise n'est configure.");
  }

  let payload: unknown;

  try {
    payload = JSON.parse(bodyResult.rawBody) as unknown;
  } catch {
    return jsonError(400, "Le payload WhatsApp doit etre un JSON valide.");
  }

  const candidates = extractWhatsAppCommandCandidates(payload);
  let accepted = 0;
  let duplicate = 0;
  let ignored = 0;

  for (const candidate of candidates) {
    if (!config.allowedSenders.has(candidate.senderPhone)) {
      ignored += 1;
      continue;
    }

    const senderFingerprint = createSenderFingerprint(
      candidate.senderPhone,
      config.appSecret,
    );
    const result = await enqueueWhatsAppCommand(candidate, senderFingerprint);

    if (result.status === "persisted") {
      accepted += 1;
      continue;
    }

    if (result.status === "duplicate") {
      duplicate += 1;
      continue;
    }

    return jsonError(
      503,
      "La file de commandes WhatsApp est temporairement indisponible.",
    );
  }

  return NextResponse.json({
    ok: true,
    gateway: "active",
    accepted,
    duplicate,
    ignored,
  });
}
