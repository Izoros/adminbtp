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

  const isJsonPayload = jsonContentTypes.some((allowedType) =>
    contentType.toLowerCase().includes(allowedType),
  );

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

export function validateWebhookAuthorization(request: Request) {
  const expectedToken = getExpectedWebhookToken();

  if (!expectedToken) {
    return {
      success: true as const,
      protectionEnabled: false,
    };
  }

  const bearerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const directToken = request.headers.get("x-adminbtp-webhook-token")?.trim();
  const providedToken = bearerToken || directToken || null;

  if (providedToken !== expectedToken) {
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
