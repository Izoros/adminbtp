import type { SupabaseClient } from "@supabase/supabase-js";

import { loadServerOrganizationScope } from "@/lib/permissions";
import {
  evaluateSuggestionGovernance,
  getAuditLogsForSuggestion,
  getGovernanceStateFromIssues,
  getLatestHumanAuditLog,
} from "@/modules/ai/services/ai-governance";
import type {
  AiSuggestion,
  AiSuggestionAuditLog,
  AiSuggestionStatus,
} from "@/modules/ai/types/ai";
import type { Json, SupabaseDatabase } from "@/types/supabase";

type AiTables = SupabaseDatabase["public"]["Tables"];
type AiSuggestionRow = AiTables["ai_suggestions"]["Row"];
type AiSuggestionAuditLogRow = AiTables["ai_suggestion_audit_logs"]["Row"];

export type AiGovernanceData = {
  source: "supabase";
  currentOrganizationId: string | null;
  suggestions: AiSuggestion[];
  auditLogs: AiSuggestionAuditLog[];
  sourceMessage: string;
};

function isRecord(value: Json): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeOutputPayload(
  value: Json,
): Record<string, string | string[] | number | boolean | null> {
  if (!isRecord(value)) {
    return {};
  }

  const payload: Record<string, string | string[] | number | boolean | null> = {};

  for (const [key, item] of Object.entries(value)) {
    if (
      typeof item === "string" ||
      typeof item === "number" ||
      typeof item === "boolean" ||
      item === null
    ) {
      payload[key] = item;
      continue;
    }

    if (Array.isArray(item) && item.every((entry) => typeof entry === "string")) {
      payload[key] = item;
    }
  }

  return payload;
}

export function buildSuggestionSummary(row: AiSuggestionRow): string {
  const payload = normalizeOutputPayload(row.output_payload);
  const directSummary = payload.summary;

  if (typeof directSummary === "string" && directSummary.length > 0) {
    return directSummary;
  }

  return `Suggestion ${row.suggestion_kind} prete pour validation humaine.`;
}

export function mapAiSuggestionRow(row: AiSuggestionRow): AiSuggestion {
  return {
    id: row.id,
    organizationId: row.organization_id,
    projectId: row.project_id ?? undefined,
    sourceEntityType: row.source_entity_type as AiSuggestion["sourceEntityType"],
    sourceEntityId: row.source_entity_id,
    kind: row.suggestion_kind as AiSuggestion["kind"],
    title: row.title,
    summary: buildSuggestionSummary(row),
    promptSnapshot: row.prompt_snapshot,
    outputPayload: normalizeOutputPayload(row.output_payload),
    status: row.status as AiSuggestionStatus,
    proposedBy: "ai",
    validatedBy: row.validated_by ?? undefined,
  };
}

export function mapAiSuggestionAuditLogRow(
  row: AiSuggestionAuditLogRow,
): AiSuggestionAuditLog {
  return {
    id: row.id,
    aiSuggestionId: row.ai_suggestion_id,
    actorType: row.actor_type as AiSuggestionAuditLog["actorType"],
    actorId: row.actor_id ?? undefined,
    action: row.action,
    details:
      typeof row.details === "string"
        ? row.details
        : JSON.stringify(row.details),
  };
}

export function enrichSuggestionsWithGovernance(
  suggestions: AiSuggestion[],
  auditLogs: AiSuggestionAuditLog[],
): AiSuggestion[] {
  return suggestions.map((suggestion) => {
    const suggestionLogs = getAuditLogsForSuggestion(auditLogs, suggestion.id);
    const latestHumanLog = getLatestHumanAuditLog(auditLogs, suggestion.id);
    const governanceIssues = evaluateSuggestionGovernance(suggestion, auditLogs);

    return {
      ...suggestion,
      appliedBy:
        suggestion.status === "applied"
          ? latestHumanLog?.actorId ?? suggestion.appliedBy
          : suggestion.appliedBy,
      governanceIssues,
      governanceState: getGovernanceStateFromIssues(governanceIssues),
      auditTrailCount: suggestionLogs.length,
    };
  });
}

export function buildEmptyAiGovernanceData(
  currentOrganizationId: string | null,
  sourceMessage = "Aucune suggestion IA reelle n'est encore disponible pour cette organisation.",
): AiGovernanceData {
  return {
    source: "supabase",
    currentOrganizationId,
    suggestions: [],
    auditLogs: [],
    sourceMessage,
  };
}

export async function loadAiGovernanceData(
  supabase: SupabaseClient<SupabaseDatabase> | null,
): Promise<AiGovernanceData> {
  if (!supabase) {
    return buildEmptyAiGovernanceData(
      null,
      "Configuration Supabase absente. Le module IA ne peut pas charger de suggestions.",
    );
  }

  const userScope = await loadServerOrganizationScope(supabase);

  if (!userScope) {
    return buildEmptyAiGovernanceData(
      null,
      "Le scope organisation est indisponible pour le module IA.",
    );
  }

  const { data: suggestionRows, error: suggestionError } = await supabase
    .from("ai_suggestions")
    .select("*")
    .in("organization_id", userScope.accessibleOrganizationIds)
    .order("created_at", { ascending: false })
    .limit(20);

  if (suggestionError) {
    return buildEmptyAiGovernanceData(
      userScope.preferredOrganizationId,
      "Supabase est accessible, mais la lecture des suggestions IA a echoue.",
    );
  }

  if (!suggestionRows?.length) {
    return buildEmptyAiGovernanceData(
      userScope.preferredOrganizationId,
      "Supabase est accessible, mais aucune suggestion IA n'est encore disponible sur ce perimetre.",
    );
  }

  const suggestionIds = suggestionRows.map((row) => row.id);
  const { data: logRows, error: logError } = await supabase
    .from("ai_suggestion_audit_logs")
    .select("*")
    .in("ai_suggestion_id", suggestionIds)
    .order("created_at", { ascending: false });

  if (logError) {
    const preferredSuggestions = suggestionRows.filter(
      (row) => row.organization_id === userScope.preferredOrganizationId,
    );
    const rowsToRender =
      preferredSuggestions.length > 0 ? preferredSuggestions : suggestionRows;

    return {
      source: "supabase",
      currentOrganizationId:
        rowsToRender[0]?.organization_id ?? userScope.preferredOrganizationId,
      suggestions: enrichSuggestionsWithGovernance(
        rowsToRender.map(mapAiSuggestionRow),
        [],
      ),
      auditLogs: [],
      sourceMessage:
        "Les suggestions IA sont chargees depuis Supabase, mais le journal d'audit est indisponible.",
    };
  }

  const auditLogs = (logRows ?? []).map(mapAiSuggestionAuditLogRow);
  const preferredSuggestions = suggestionRows.filter(
    (row) => row.organization_id === userScope.preferredOrganizationId,
  );
  const rowsToRender =
    preferredSuggestions.length > 0 ? preferredSuggestions : suggestionRows;

  return {
    source: "supabase",
    currentOrganizationId:
      rowsToRender[0]?.organization_id ?? userScope.preferredOrganizationId,
    suggestions: enrichSuggestionsWithGovernance(
      rowsToRender.map(mapAiSuggestionRow),
      auditLogs,
    ),
    auditLogs,
    sourceMessage: `${rowsToRender.length} suggestion(s) IA chargee(s) depuis Supabase.`,
  };
}
