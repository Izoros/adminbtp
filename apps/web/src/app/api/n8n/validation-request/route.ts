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
import { resolveSignatureWebhookContext } from "@/modules/signatures/services/signature-webhook-data";

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
    const signatureContext = await resolveSignatureWebhookContext(
      payload.signatureRequestId,
    );
    const resolvedDestination =
      payload.destination ?? signatureContext.whatsappPayload?.destination;
    const resolvedBody = payload.body ?? signatureContext.whatsappPayload?.body;

    if (!resolvedDestination || !resolvedBody) {
      return NextResponse.json(
        {
          ok: false,
          errors: [
            "Aucun payload WhatsApp complet n'a pu etre resolu pour cette demande de signature.",
          ],
          signatureContext,
        },
        { status: 400 },
      );
    }

    const outboundPayload = createValidationWebhookPayload(
      payload.signatureRequestId,
      resolvedDestination,
      resolvedBody,
    );

    return NextResponse.json({
      ok: true,
      authorization: {
        protectionEnabled: authorizationValidation.protectionEnabled,
      },
      payload,
      outboundPayload,
      signatureContext,
      dataOrigin:
        signatureContext.dataOrigin === "supabase" || reader ? "supabase" : "demo",
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
