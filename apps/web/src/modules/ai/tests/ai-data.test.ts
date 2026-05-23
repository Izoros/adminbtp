import { describe, expect, it } from "vitest";

import {
  buildDemoAiGovernanceData,
  buildEmptyAiGovernanceData,
  buildSuggestionSummary,
  enrichSuggestionsWithGovernance,
  mapAiSuggestionAuditLogRow,
  mapAiSuggestionRow,
} from "@/modules/ai/services/ai-data";
import type { SupabaseDatabase } from "@/types/supabase";

type AiTables = SupabaseDatabase["public"]["Tables"];

describe("ai-data", () => {
  it("replie sur les donnees de demonstration", () => {
    const data = buildDemoAiGovernanceData();

    expect(data.source).toBe("demo");
    expect(data.suggestions.length).toBeGreaterThan(0);
  });

  it("reconstruit un resume depuis le payload Supabase", () => {
    const row: AiTables["ai_suggestions"]["Row"] = {
      applied_at: null,
      created_at: "2026-05-22T08:00:00.000Z",
      id: "ai_001",
      organization_id: "org_001",
      output_payload: {
        summary: "Resume calcule depuis Supabase.",
        confidence: "elevee",
      },
      project_id: "project_001",
      prompt_snapshot: "Resumer le mail",
      proposed_by: "ai",
      source_entity_id: "email_001",
      source_entity_type: "email",
      status: "pending_human_validation",
      suggestion_kind: "email_summary",
      title: "Resume de mail",
      validated_at: null,
      validated_by: null,
    };

    expect(buildSuggestionSummary(row)).toBe("Resume calcule depuis Supabase.");
    expect(mapAiSuggestionRow(row).outputPayload.confidence).toBe("elevee");
  });

  it("serialise les details d audit complexes", () => {
    const row: AiTables["ai_suggestion_audit_logs"]["Row"] = {
      action: "approved",
      actor_id: "user_001",
      actor_type: "user",
      ai_suggestion_id: "ai_001",
      created_at: "2026-05-22T08:00:00.000Z",
      details: {
        decision: "approved",
        reason: "Validation humaine",
      },
      id: "log_001",
    };

    const log = mapAiSuggestionAuditLogRow(row);

    expect(log.details).toContain("approved");
    expect(log.actorType).toBe("user");
  });

  it("retourne un etat vide reel quand Supabase n a aucune suggestion", () => {
    const data = buildEmptyAiGovernanceData("org_001");

    expect(data.source).toBe("supabase");
    expect(data.currentOrganizationId).toBe("org_001");
    expect(data.suggestions).toHaveLength(0);
  });

  it("enrichit les suggestions avec la gouvernance et l audit", () => {
    const suggestion = {
      ...mapAiSuggestionRow({
        applied_at: null,
        created_at: "2026-05-22T08:00:00.000Z",
        id: "ai_002",
        organization_id: "org_001",
        output_payload: { summary: "Synthese" },
        project_id: "project_001",
        prompt_snapshot: "Resumer",
        proposed_by: "ai",
        source_entity_id: "email_001",
        source_entity_type: "email",
        status: "approved",
        suggestion_kind: "email_summary",
        title: "Resume",
        validated_at: "2026-05-22T09:00:00.000Z",
        validated_by: "user_001",
      }),
    };
    const logs = [
      {
        id: "log_002",
        aiSuggestionId: "ai_002",
        actorType: "user" as const,
        actorId: "user_001",
        action: "approved",
        details: "Validation humaine",
      },
    ];

    const [enrichedSuggestion] = enrichSuggestionsWithGovernance([suggestion], logs);

    expect(enrichedSuggestion?.governanceState).toBe("healthy");
    expect(enrichedSuggestion?.auditTrailCount).toBe(1);
  });
});
