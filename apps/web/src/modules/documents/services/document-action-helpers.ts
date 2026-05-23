import type { DocumentVariableMap } from "@/modules/documents/types/document";

export function buildDocumentVariablesFromFormData(formData: FormData): DocumentVariableMap {
  const recipientName = readOptionalField(formData, "recipientName") ?? "Interlocuteur chantier";
  const projectName = readOptionalField(formData, "projectName") ?? "Projet non renseigne";
  const meetingDate = readOptionalField(formData, "meetingDate") ?? new Date().toISOString().slice(0, 10);
  const progressSummary =
    readOptionalField(formData, "progressSummary") ?? "Avancement a consolider";
  const attentionPoint =
    readOptionalField(formData, "attentionPoint") ?? "Aucun point d'attention remonte";
  const nextDeadline =
    readOptionalField(formData, "nextDeadline") ?? "Echeance a definir";
  const senderName = readOptionalField(formData, "senderName") ?? "Equipe AdminBTP";

  return {
    recipient_name: recipientName,
    project_name: projectName,
    meeting_date: meetingDate,
    progress_summary: progressSummary,
    attention_point: attentionPoint,
    next_deadline: nextDeadline,
    sender_name: senderName,
  };
}

function readOptionalField(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
