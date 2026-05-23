import type {
  AiGovernanceIssue,
  AiSuggestion,
  AiSuggestionAuditLog,
  AiSuggestionKind,
} from "@/modules/ai/types/ai";
import type { GeneratedDocument } from "@/modules/documents/types/document";
import type { EmailRecord } from "@/modules/emails/types/email";
import type { Project } from "@/modules/projects/types/project";

export function buildEmailSummarySuggestion(email: EmailRecord): AiSuggestion {
  return {
    id: `ai-email-${email.id}`,
    organizationId: email.organizationId,
    projectId: email.projectId,
    sourceEntityType: "email",
    sourceEntityId: email.id,
    kind: "email_summary",
    title: `Resume IA - ${email.subject}`,
    summary: `Synthese du message de ${email.senderName}.`,
    promptSnapshot: "Resumer le mail et proposer une action suivante.",
    outputPayload: {
      summary: email.bodyText.slice(0, 120),
      nextAction: "Validation humaine requise avant creation de tache.",
    },
    status: "pending_human_validation",
    proposedBy: "ai",
  };
}

export function buildDocumentClassificationSuggestion(
  document: GeneratedDocument,
  organizationId: string,
): AiSuggestion {
  return {
    id: `ai-document-${document.id}`,
    organizationId,
    sourceEntityType: "document",
    sourceEntityId: document.id,
    kind: "document_classification",
    title: `Classification IA - ${document.title}`,
    summary: "Proposition de famille documentaire a confirmer.",
    promptSnapshot: "Classifier le document selon les categories metier AdminBTP.",
    outputPayload: {
      detectedType: "ppsps",
      rationale: document.subject,
    },
    status: "pending_human_validation",
    proposedBy: "ai",
  };
}

export function buildLetterDraftSuggestion(project: Project): AiSuggestion {
  return {
    id: `ai-letter-${project.id}`,
    organizationId: project.ownerOrganizationId,
    projectId: project.id,
    sourceEntityType: "project",
    sourceEntityId: project.id,
    kind: "letter_draft",
    title: `Projet de courrier - ${project.name}`,
    summary: "Projet de courrier genere pour revue humaine.",
    promptSnapshot: "Rediger un courrier administratif a partir du contexte chantier.",
    outputPayload: {
      draft:
        "Projet de courrier a relire et valider avant toute transmission externe.",
    },
    status: "pending_human_validation",
    proposedBy: "ai",
  };
}

export function buildSmartSearchSuggestion(
  organizationId: string,
  query: string,
  results: string[],
): AiSuggestion {
  return {
    id: `ai-search-${query.toLowerCase().replaceAll(" ", "-")}`,
    organizationId,
    sourceEntityType: "search",
    sourceEntityId: "search_context",
    kind: "smart_search",
    title: `Recherche intelligente - ${query}`,
    summary: "Selection de resultats relies a la requete.",
    promptSnapshot: "Rechercher les contenus metier les plus proches de la requete.",
    outputPayload: {
      query,
      results,
    },
    status: "pending_human_validation",
    proposedBy: "ai",
  };
}

export function normalizeSuggestionReviewDecision(
  value: string | null | undefined,
): "approved" | "rejected" | null {
  if (value === "approved" || value === "rejected") {
    return value;
  }

  return null;
}

export function approveSuggestion(
  suggestion: AiSuggestion,
  validatorId: string,
): AiSuggestion {
  return {
    ...suggestion,
    status: "approved",
    validatedBy: validatorId,
  };
}

export function rejectSuggestion(
  suggestion: AiSuggestion,
  validatorId: string,
): AiSuggestion {
  return {
    ...suggestion,
    status: "rejected",
    validatedBy: validatorId,
  };
}

export function applySuggestion(
  suggestion: AiSuggestion,
  operatorId: string,
): AiSuggestion {
  if (suggestion.status !== "approved") {
    throw new Error("Une suggestion IA doit etre approuvee avant application.");
  }

  if ((suggestion.governanceState ?? "healthy") === "blocked") {
    throw new Error("Une suggestion IA bloquee par la gouvernance ne peut pas etre appliquee.");
  }

  if (!suggestion.validatedBy) {
    throw new Error("Une suggestion IA approuvee doit conserver son validateur humain.");
  }

  return {
    ...suggestion,
    status: "applied",
    appliedBy: operatorId,
  };
}

export function createAuditLog(
  aiSuggestionId: string,
  action: string,
  actorType: "ai" | "user" | "system",
  details: string,
  actorId?: string,
): AiSuggestionAuditLog {
  return {
    id: `${aiSuggestionId}-${action}`,
    aiSuggestionId,
    actorType,
    actorId,
    action,
    details,
  };
}

export function getSuggestionsByKind(
  suggestions: AiSuggestion[],
  kind: AiSuggestionKind,
) {
  return suggestions.filter((suggestion) => suggestion.kind === kind);
}

export function getAuditLogsForSuggestion(
  logs: AiSuggestionAuditLog[],
  aiSuggestionId: string,
) {
  return logs.filter((log) => log.aiSuggestionId === aiSuggestionId);
}

export function getLatestHumanAuditLog(
  logs: AiSuggestionAuditLog[],
  aiSuggestionId: string,
) {
  return getAuditLogsForSuggestion(logs, aiSuggestionId).find(
    (log) => log.actorType === "user",
  );
}

export function evaluateSuggestionGovernance(
  suggestion: AiSuggestion,
  logs: AiSuggestionAuditLog[],
): AiGovernanceIssue[] {
  const issues: AiGovernanceIssue[] = [];
  const suggestionLogs = getAuditLogsForSuggestion(logs, suggestion.id);
  const hasHumanLog = suggestionLogs.some((log) => log.actorType === "user");
  const payloadKeys = Object.keys(suggestion.outputPayload);

  if (!suggestion.promptSnapshot.trim()) {
    issues.push({
      code: "missing_prompt_snapshot",
      severity: "critical",
      message: "Le prompt de reference est absent.",
    });
  }

  if (payloadKeys.length === 0) {
    issues.push({
      code: "empty_output_payload",
      severity: "warning",
      message: "La sortie IA est vide et doit etre recontrolee.",
    });
  }

  if (
    (suggestion.status === "approved" ||
      suggestion.status === "rejected" ||
      suggestion.status === "applied") &&
    !suggestion.validatedBy
  ) {
    issues.push({
      code: "missing_validator",
      severity: "critical",
      message: "Le validateur humain n'est pas renseigne.",
    });
  }

  if (
    (suggestion.status === "approved" || suggestion.status === "applied") &&
    !hasHumanLog
  ) {
    issues.push({
      code: "missing_human_audit_log",
      severity: "critical",
      message: "Aucune trace humaine n'explique la validation ou l'application.",
    });
  }

  if (suggestion.status === "applied" && !suggestion.appliedBy) {
    issues.push({
      code: "missing_operator",
      severity: "warning",
      message: "L'operateur ayant applique la suggestion n'est pas connu.",
    });
  }

  return issues;
}

export function getGovernanceStateFromIssues(
  issues: AiGovernanceIssue[],
): "healthy" | "warning" | "blocked" {
  if (issues.some((issue) => issue.severity === "critical")) {
    return "blocked";
  }

  if (issues.length > 0) {
    return "warning";
  }

  return "healthy";
}
