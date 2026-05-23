import { describe, expect, it } from "vitest";

import {
  applySuggestion,
  approveSuggestion,
  buildDocumentClassificationSuggestion,
  buildEmailSummarySuggestion,
  createAuditLog,
  evaluateSuggestionGovernance,
  getGovernanceStateFromIssues,
  getAuditLogsForSuggestion,
  getSuggestionsByKind,
  normalizeSuggestionReviewDecision,
} from "@/modules/ai/services/ai-governance";
import {
  demoAiAuditLogs,
  demoAiDocument,
  demoAiEmail,
  demoAiSuggestions,
} from "@/modules/ai/services/demo-ai";

describe("ai-governance", () => {
  it("genere une suggestion de resume de mail en attente de validation", () => {
    const suggestion = buildEmailSummarySuggestion(demoAiEmail);

    expect(suggestion.kind).toBe("email_summary");
    expect(suggestion.status).toBe("pending_human_validation");
  });

  it("interdit l application sans approbation humaine", () => {
    const suggestion = buildDocumentClassificationSuggestion(
      demoAiDocument,
      demoAiEmail.organizationId,
    );

    expect(() => applySuggestion(suggestion, "user_admin_001")).toThrow(
      "Une suggestion IA doit etre approuvee avant application.",
    );
  });

  it("autorise l application apres approbation humaine", () => {
    const suggestion = buildDocumentClassificationSuggestion(
      demoAiDocument,
      demoAiEmail.organizationId,
    );
    const approvedSuggestion = approveSuggestion(suggestion, "user_admin_001");
    const appliedSuggestion = applySuggestion(
      approvedSuggestion,
      "user_admin_001",
    );

    expect(appliedSuggestion.status).toBe("applied");
    expect(appliedSuggestion.appliedBy).toBe("user_admin_001");
  });

  it("filtre les suggestions par type", () => {
    const emailSuggestions = getSuggestionsByKind(
      demoAiSuggestions,
      "email_summary",
    );

    expect(emailSuggestions).toHaveLength(1);
    expect(emailSuggestions[0]?.id).toBe("ai_suggestion_001");
  });

  it("retourne l audit d une suggestion", () => {
    const logs = getAuditLogsForSuggestion(demoAiAuditLogs, "ai_suggestion_002");

    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe("approved");
  });

  it("cree une entree d audit tracable", () => {
    const log = createAuditLog(
      "ai_suggestion_004",
      "approved",
      "user",
      "Validation humaine effectuee.",
      "user_admin_001",
    );

    expect(log.id).toBe("ai_suggestion_004-approved");
    expect(log.actorId).toBe("user_admin_001");
  });

  it("bloque une suggestion approuvee sans trace humaine", () => {
    const approvedSuggestion = approveSuggestion(
      buildDocumentClassificationSuggestion(
        demoAiDocument,
        demoAiEmail.organizationId,
      ),
      "user_admin_001",
    );
    const issues = evaluateSuggestionGovernance(approvedSuggestion, []);

    expect(getGovernanceStateFromIssues(issues)).toBe("blocked");
    expect(() =>
      applySuggestion(
        {
          ...approvedSuggestion,
          governanceState: "blocked",
        },
        "user_admin_001",
      ),
    ).toThrow("Une suggestion IA bloquee par la gouvernance ne peut pas etre appliquee.");
  });

  it("normalise la decision de revue IA", () => {
    expect(normalizeSuggestionReviewDecision("approved")).toBe("approved");
    expect(normalizeSuggestionReviewDecision("rejected")).toBe("rejected");
    expect(normalizeSuggestionReviewDecision("autre")).toBeNull();
  });
});
