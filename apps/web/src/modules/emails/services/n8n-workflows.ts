import type { WorkflowTask } from "@/modules/followups/types/task";
import type {
  InboundEmailWebhookPayload,
  NormalizedInboundEmailWebhookPayload,
  NormalizedValidationRequestWebhookPayload,
  ValidationRequestWebhookPayload,
  WebhookValidationResult,
} from "@/modules/emails/types/webhook";

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isE164PhoneNumber(value: string) {
  return /^\+[1-9]\d{6,14}$/.test(value);
}

function createTaskSlug(value: string) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

export function validateInboundEmailWebhookPayload(
  input: unknown,
): WebhookValidationResult<NormalizedInboundEmailWebhookPayload> {
  const payload = input as Partial<InboundEmailWebhookPayload> | null;
  const errors: string[] = [];

  if (!payload || typeof payload !== "object") {
    return {
      success: false,
      errors: ["Le payload entrant doit etre un objet JSON."],
    };
  }

  if (!isNonEmptyString(payload.organizationId)) {
    errors.push("organizationId est obligatoire.");
  }

  if (!isNonEmptyString(payload.sourceEmail)) {
    errors.push("sourceEmail est obligatoire.");
  } else if (!isEmailAddress(payload.sourceEmail.trim())) {
    errors.push("sourceEmail doit etre une adresse email valide.");
  }

  if (payload.projectId !== undefined && !isNonEmptyString(payload.projectId)) {
    errors.push("projectId doit etre une chaine non vide s'il est fourni.");
  }

  if (payload.relatedTaskId !== undefined && !isNonEmptyString(payload.relatedTaskId)) {
    errors.push("relatedTaskId doit etre une chaine non vide s'il est fourni.");
  }

  if (payload.senderEmail !== undefined && !isNonEmptyString(payload.senderEmail)) {
    errors.push("senderEmail doit etre une chaine non vide s'il est fourni.");
  } else if (
    isNonEmptyString(payload.senderEmail) &&
    !isEmailAddress(payload.senderEmail.trim())
  ) {
    errors.push("senderEmail doit etre une adresse email valide s'il est fourni.");
  }

  if (payload.externalMessageId !== undefined && !isNonEmptyString(payload.externalMessageId)) {
    errors.push("externalMessageId doit etre une chaine non vide s'il est fourni.");
  }

  if (payload.mailboxAddress !== undefined && !isNonEmptyString(payload.mailboxAddress)) {
    errors.push("mailboxAddress doit etre une chaine non vide s'il est fourni.");
  } else if (
    isNonEmptyString(payload.mailboxAddress) &&
    !isEmailAddress(payload.mailboxAddress.trim())
  ) {
    errors.push("mailboxAddress doit etre une adresse email valide s'il est fourni.");
  }

  const titleCandidate =
    isNonEmptyString(payload.title)
      ? payload.title
      : isNonEmptyString(payload.subject)
        ? payload.subject
        : null;

  if (!titleCandidate) {
    errors.push("title ou subject est obligatoire.");
  }

  const descriptionCandidate =
    isNonEmptyString(payload.description)
      ? payload.description
      : isNonEmptyString(payload.bodyText)
        ? payload.bodyText
        : null;

  if (!descriptionCandidate) {
    errors.push("description ou bodyText est obligatoire.");
  }

  if (payload.receivedAt !== undefined) {
    const receivedAtDate = new Date(payload.receivedAt);

    if (Number.isNaN(receivedAtDate.getTime())) {
      errors.push("receivedAt doit etre une date ISO valide s'il est fourni.");
    }
  }

  if (errors.length > 0 || !titleCandidate || !descriptionCandidate) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: {
      organizationId: normalizeWhitespace(payload.organizationId!),
      projectId: isNonEmptyString(payload.projectId)
        ? normalizeWhitespace(payload.projectId)
        : undefined,
      title: normalizeWhitespace(titleCandidate),
      description: descriptionCandidate.trim(),
      sourceEmail: normalizeWhitespace(payload.sourceEmail!),
      mailboxAddress: isNonEmptyString(payload.mailboxAddress)
        ? normalizeWhitespace(payload.mailboxAddress)
        : normalizeWhitespace(payload.sourceEmail!),
      senderEmail: isNonEmptyString(payload.senderEmail)
        ? normalizeWhitespace(payload.senderEmail)
        : undefined,
      senderName: isNonEmptyString(payload.senderName)
        ? normalizeWhitespace(payload.senderName)
        : undefined,
      subject: isNonEmptyString(payload.subject)
        ? normalizeWhitespace(payload.subject)
        : undefined,
      bodyText: isNonEmptyString(payload.bodyText) ? payload.bodyText.trim() : undefined,
      receivedAt: payload.receivedAt,
      externalMessageId: isNonEmptyString(payload.externalMessageId)
        ? normalizeWhitespace(payload.externalMessageId)
        : undefined,
      classification: payload.classification ?? "unclassified",
      relatedTaskId: isNonEmptyString(payload.relatedTaskId)
        ? normalizeWhitespace(payload.relatedTaskId)
        : undefined,
      persistEmail: payload.persistEmail ?? true,
    },
  };
}

export function validateValidationRequestWebhookPayload(
  input: unknown,
): WebhookValidationResult<NormalizedValidationRequestWebhookPayload> {
  const payload = input as Partial<ValidationRequestWebhookPayload> | null;
  const errors: string[] = [];

  if (!payload || typeof payload !== "object") {
    return {
      success: false,
      errors: ["Le payload de validation doit etre un objet JSON."],
    };
  }

  if (!isNonEmptyString(payload.signatureRequestId)) {
    errors.push("signatureRequestId est obligatoire.");
  }

  if (payload.channel !== undefined && payload.channel !== "whatsapp") {
    errors.push("Seul le canal whatsapp est accepte.");
  }

  if (!isNonEmptyString(payload.destination)) {
    errors.push("destination est obligatoire.");
  } else if (!isE164PhoneNumber(payload.destination.trim())) {
    errors.push("destination doit etre un numero E.164 valide.");
  }

  if (!isNonEmptyString(payload.body)) {
    errors.push("body est obligatoire.");
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: {
      signatureRequestId: normalizeWhitespace(payload.signatureRequestId!),
      channel: "whatsapp",
      destination: normalizeWhitespace(payload.destination!),
      body: payload.body!.trim(),
    },
  };
}

export function createTaskFromInboundWebhook(
  payload: InboundEmailWebhookPayload | NormalizedInboundEmailWebhookPayload,
): WorkflowTask {
  const validationResult = validateInboundEmailWebhookPayload(payload);
  const normalizedPayload = validationResult.success ? validationResult.data : null;

  if (!normalizedPayload) {
    throw new Error("Le payload entrant n'est pas valide pour creer une tache.");
  }

  return {
    id: `task_${normalizedPayload.organizationId}_${createTaskSlug(
      normalizedPayload.title ?? "tache",
    )}`,
    organizationId: normalizedPayload.organizationId,
    projectId: normalizedPayload.projectId,
    title: normalizedPayload.title ?? "Tache email entrante",
    description: `${normalizedPayload.description}\nSource email : ${normalizedPayload.sourceEmail}`,
    source: "n8n",
    status: "open",
  };
}

export function createValidationWebhookPayload(
  signatureRequestId: string,
  destination: string,
  body: string,
): ValidationRequestWebhookPayload {
  const validationResult = validateValidationRequestWebhookPayload({
    signatureRequestId,
    destination,
    body,
    channel: "whatsapp",
  });

  if (!validationResult.success) {
    throw new Error(validationResult.errors.join(" "));
  }

  return {
    signatureRequestId: validationResult.data.signatureRequestId,
    destination: validationResult.data.destination,
    body: validationResult.data.body,
    channel: validationResult.data.channel,
  };
}
