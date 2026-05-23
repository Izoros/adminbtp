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

async function parseWebhookJsonBody(request: Request) {
  try {
    return {
      success: true as const,
      data: (await request.json()) as unknown,
    };
  } catch {
    return {
      success: false as const,
      status: 400,
      errors: ["Le corps de requete doit contenir un JSON valide."],
    };
  }
}

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

  const jsonBody = await parseWebhookJsonBody(request);

  if (!jsonBody.success) {
    return NextResponse.json(
      {
        ok: false,
        errors: jsonBody.errors,
      },
      { status: jsonBody.status },
    );
  }

  const validationResult = validateValidationRequestWebhookPayload(jsonBody.data);

  if (!validationResult.success) {
    return NextResponse.json(
      {
        ok: false,
        errors: validationResult.errors,
      },
      { status: 400 },
    );
  }

  try {
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
  } catch {
    return NextResponse.json(
      {
        ok: false,
        errors: ["La preparation de la demande de validation a echoue."],
      },
      { status: 502 },
    );
  }
}
