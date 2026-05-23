import { NextResponse } from "next/server";

import {
  validateJsonRequest,
  validateWebhookAuthorization,
} from "@/app/api/n8n/_lib/webhook-guards";
import {
  createValidationWebhookPayload,
  validateValidationRequestWebhookPayload,
} from "@/modules/emails/services/n8n-workflows";
import { createEmailSupabaseReader } from "@/modules/emails/services/supabase-email-data";

export async function POST(request: Request) {
  const jsonValidation = validateJsonRequest(request);

  if (!jsonValidation.success) {
    return NextResponse.json(
      {
        ok: false,
        errors: jsonValidation.errors,
      },
      { status: jsonValidation.status },
    );
  }

  const authorizationValidation = validateWebhookAuthorization(request);

  if (!authorizationValidation.success) {
    return NextResponse.json(
      {
        ok: false,
        errors: authorizationValidation.errors,
      },
      { status: authorizationValidation.status },
    );
  }

  let rawPayload: unknown;

  try {
    rawPayload = (await request.json()) as unknown;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        errors: ["Le corps de requete doit contenir un JSON valide."],
      },
      { status: 400 },
    );
  }

  const validationResult = validateValidationRequestWebhookPayload(rawPayload);

  if (!validationResult.success) {
    return NextResponse.json(
      {
        ok: false,
        errors: validationResult.errors,
      },
      { status: 400 },
    );
  }

  const payload = validationResult.data;
  const reader = await createEmailSupabaseReader();

  const outboundPayload = createValidationWebhookPayload(
    payload.signatureRequestId,
    payload.destination,
    payload.body,
  );

  return NextResponse.json({
    ok: true,
    authorization: {
      protectionEnabled: authorizationValidation.protectionEnabled,
    },
    payload,
    outboundPayload,
    dataOrigin: reader ? "supabase" : "demo",
  });
}
