import { timingSafeEqual } from "node:crypto";

const jsonContentTypes = [
  "application/json",
  "application/cloudevents+json",
] as const;

function getExpectedWebhookToken() {
  return process.env.ADMINBTP_N8N_WEBHOOK_TOKEN?.trim() || null;
}

export function validateJsonRequest(request: Request) {
  const contentType = request.headers.get("content-type");

  if (!contentType) {
    return {
      success: false as const,
      status: 415,
      errors: ["Le header content-type est obligatoire."],
    };
  }

  const normalizedContentType = contentType.split(";")[0]?.trim().toLowerCase();
  const isJsonPayload = normalizedContentType
    ? jsonContentTypes.includes(normalizedContentType as (typeof jsonContentTypes)[number])
    : false;

  if (!isJsonPayload) {
    return {
      success: false as const,
      status: 415,
      errors: ["Le content-type doit etre JSON."],
    };
  }

  return {
    success: true as const,
  };
}

function hasMatchingWebhookToken(expectedToken: string, providedToken: string | null) {
  if (!providedToken) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedToken, "utf8");
  const providedBuffer = Buffer.from(providedToken, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export function validateWebhookAuthorization(request: Request) {
  const expectedToken = getExpectedWebhookToken();

  if (!expectedToken) {
    return {
      success: true as const,
      protectionEnabled: false,
    };
  }

  const bearerTokenHeader = request.headers.get("authorization");
  const bearerToken =
    bearerTokenHeader && /^Bearer\s+/i.test(bearerTokenHeader)
      ? bearerTokenHeader.replace(/^Bearer\s+/i, "").trim()
      : null;
  const directToken = request.headers.get("x-adminbtp-webhook-token")?.trim() || null;
  const providedTokens = [bearerToken, directToken].filter(
    (token): token is string => Boolean(token),
  );

  if (!providedTokens.some((providedToken) => hasMatchingWebhookToken(expectedToken, providedToken))) {
    return {
      success: false as const,
      protectionEnabled: true,
      status: 401,
      errors: ["Le token webhook est invalide ou absent."],
    };
  }

  return {
    success: true as const,
    protectionEnabled: true,
  };
}
