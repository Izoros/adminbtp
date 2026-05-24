import { NextResponse } from "next/server";

import {
  validateJsonRequest,
  validateWebhookAuthorization,
} from "@/app/api/n8n/_lib/webhook-guards";
import {
  createTaskFromInboundWebhook,
  validateInboundEmailWebhookPayload,
} from "@/modules/emails/services/n8n-workflows";
import {
  persistInboundEmail,
  resolveMailboxForInboundWebhook,
} from "@/modules/emails/services/supabase-email-data";

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

  const validationResult = validateInboundEmailWebhookPayload(jsonBody.data);

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
    const task = createTaskFromInboundWebhook(payload);
    const initialMailboxResolution = await resolveMailboxForInboundWebhook(
      payload.organizationId,
      payload.mailboxAddress,
    );
    const persistence = await persistInboundEmail(payload);
    const mailboxResolution = {
      ...initialMailboxResolution,
      mailboxId: persistence.mailboxId ?? initialMailboxResolution.mailboxId,
      mailboxCreated: persistence.mailboxCreated ?? false,
    };

    return NextResponse.json({
      ok: true,
      authorization: {
        protectionEnabled: authorizationValidation.protectionEnabled,
      },
      payload,
      task,
      mailboxResolution,
      persistence,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        errors: ["Le traitement du webhook entrant a echoue."],
      },
      { status: 502 },
    );
  }
}
