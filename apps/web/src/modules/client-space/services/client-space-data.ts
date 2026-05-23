import type { SupabaseClient } from "@supabase/supabase-js";

import {
  loadServerOrganizationScope,
  resolvePreferredOrganizationId as resolveScopedPreferredOrganizationId,
} from "@/lib/permissions";
import {
  filterCommentsForVisibleItems,
  filterWorkspaceItemsForViewer,
  resolveWorkspaceItemStatus,
} from "@/modules/client-space/services/client-space-access";
import {
  demoClientComments,
  demoClientWorkspaceItems,
} from "@/modules/client-space/services/demo-client-space";
import type {
  ClientComment,
  ClientDecision,
  ClientWorkspaceItem,
  ClientWorkspaceItemType,
  ClientViewerMode,
} from "@/modules/client-space/types/client-space";
import type { SupabaseDatabase } from "@/types/supabase";

type ClientSpaceTables = SupabaseDatabase["public"]["Tables"];
type ClientPortalAccessRow = ClientSpaceTables["client_portal_accesses"]["Row"];
type ClientFeedbackThreadRow = ClientSpaceTables["client_feedback_threads"]["Row"];
type UserProfileRow = ClientSpaceTables["user_profiles"]["Row"];

export type ClientSpaceData = {
  source: "demo" | "supabase";
  clientOrganizationId: string | null;
  viewerMode: ClientViewerMode;
  workspaceItems: ClientWorkspaceItem[];
  comments: ClientComment[];
};

type ClientSpaceUserScope = {
  preferredOrganizationId: string | null;
  organizationIds: string[];
  viewerMode: "internal" | "client";
};

const CLIENT_DECISION_PREFIX = "[[decision:";

export function formatClientDecisionMessage(input: {
  decision: ClientDecision;
  message?: string | null;
}): string {
  const normalizedMessage = sanitizeClientCommentDraft({
    message: input.message,
  });

  return `${CLIENT_DECISION_PREFIX}${input.decision}]]${normalizedMessage ? ` ${normalizedMessage}` : ""}`;
}

export function parseClientDecisionMessage(message: string): {
  decision: ClientDecision | null;
  visibleMessage: string;
} {
  if (!message.startsWith(CLIENT_DECISION_PREFIX)) {
    return {
      decision: null,
      visibleMessage: message,
    };
  }

  const markerEnd = message.indexOf("]]");

  if (markerEnd === -1) {
    return {
      decision: null,
      visibleMessage: message,
    };
  }

  const rawDecision = message.slice(CLIENT_DECISION_PREFIX.length, markerEnd);
  const visibleMessage = message.slice(markerEnd + 2).trim();

  if (
    rawDecision !== "approved" &&
    rawDecision !== "rejected" &&
    rawDecision !== "commented"
  ) {
    return {
      decision: null,
      visibleMessage: visibleMessage || message,
    };
  }

  return {
    decision: rawDecision,
    visibleMessage,
  };
}

export function inferWorkspaceItemType(accessScope: string): ClientWorkspaceItemType {
  const normalizedScope = accessScope.toLowerCase();

  if (normalizedScope.includes("validation")) {
    return "validation";
  }

  if (normalizedScope.includes("relance") || normalizedScope.includes("followup")) {
    return "followup";
  }

  if (normalizedScope.includes("ticket")) {
    return "ticket";
  }

  return "document";
}

export function mapClientPortalAccessRow(
  row: ClientPortalAccessRow,
): ClientWorkspaceItem {
  const itemType = inferWorkspaceItemType(row.access_scope);

  return {
    id: row.id,
    organizationId: row.organization_id,
    clientOrganizationId: row.client_organization_id,
    projectId: row.project_id ?? "non_renseigne",
    type: itemType,
    accessScope: row.access_scope,
    title: `Acces ${itemType} - ${row.access_scope}`,
    summary: `Acces ${row.access_scope} actif pour consultation client.`,
    status: "pending",
  };
}

export function mapClientFeedbackThreadRow(
  row: ClientFeedbackThreadRow,
): ClientComment {
  const parsedDecision = parseClientDecisionMessage(row.message);

  return {
    id: row.id,
    workspaceItemId: row.related_entity_id,
    clientOrganizationId: row.client_organization_id,
    authorRole: row.author_role as ClientComment["authorRole"],
    message: parsedDecision.visibleMessage,
    createdAt: row.created_at,
    decision: parsedDecision.decision,
  };
}

export function sanitizeClientCommentDraft(input: {
  message?: string | null;
}): string | null {
  const message = input.message?.trim();

  if (!message) {
    return null;
  }

  return message;
}

export function resolvePreferredOrganizationId(
  profile: UserProfileRow | null,
  organizationIds: string[],
): string | null {
  return resolveScopedPreferredOrganizationId(profile, organizationIds);
}

async function resolveClientSpaceUserScope(
  supabase: SupabaseClient<SupabaseDatabase>,
): Promise<ClientSpaceUserScope | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const [organizationScope, { data: profile, error: profileError }] = await Promise.all([
    loadServerOrganizationScope(supabase),
    supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (profileError || !organizationScope) {
    return null;
  }

  return {
    preferredOrganizationId: organizationScope.preferredOrganizationId,
    organizationIds: organizationScope.accessibleOrganizationIds,
    viewerMode: profile ? "internal" : "client",
  };
}

export function buildDemoClientSpaceData(): ClientSpaceData {
  return {
    source: "demo",
    clientOrganizationId: "org_client_004",
    viewerMode: "demo",
    workspaceItems: demoClientWorkspaceItems.filter(
      (item) => item.clientOrganizationId === "org_client_004",
    ),
    comments: demoClientComments,
  };
}

export function buildEmptyClientSpaceData(
  viewerMode: "internal" | "client",
  clientOrganizationId: string | null,
): ClientSpaceData {
  return {
    source: "supabase",
    clientOrganizationId,
    viewerMode,
    workspaceItems: [],
    comments: [],
  };
}

export async function loadClientSpaceData(
  supabase: SupabaseClient<SupabaseDatabase> | null,
): Promise<ClientSpaceData> {
  if (!supabase) {
    return buildDemoClientSpaceData();
  }

  const userScope = await resolveClientSpaceUserScope(supabase);

  if (!userScope) {
    return buildDemoClientSpaceData();
  }

  // On recharge les acces actifs puis on applique un filtrage metier strict cote module.
  const { data: accessRows, error: accessError } = await supabase
    .from("client_portal_accesses")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(40);

  if (accessError) {
    return buildDemoClientSpaceData();
  }

  const visibleWorkspaceItems = filterWorkspaceItemsForViewer(
    (accessRows ?? []).map(mapClientPortalAccessRow),
    userScope.organizationIds,
    userScope.viewerMode,
  );

  if (visibleWorkspaceItems.length === 0) {
    return buildEmptyClientSpaceData(
      userScope.viewerMode,
      userScope.preferredOrganizationId,
    );
  }

  const { data: feedbackRows, error: feedbackError } = await supabase
    .from("client_feedback_threads")
    .select("*")
    .in(
      "related_entity_id",
      visibleWorkspaceItems.map((item) => item.id),
    )
    .order("created_at", { ascending: false })
    .limit(60);

  if (feedbackError) {
    return buildDemoClientSpaceData();
  }

  const comments = filterCommentsForVisibleItems(
    (feedbackRows ?? []).map(mapClientFeedbackThreadRow),
    visibleWorkspaceItems,
  );

  const workspaceItems = visibleWorkspaceItems.map((item) =>
    updateWorkspaceItemStatusFromComments(item, comments),
  );

  return {
    source: "supabase",
    clientOrganizationId:
      userScope.viewerMode === "client"
        ? userScope.preferredOrganizationId
        : workspaceItems[0]?.clientOrganizationId ?? null,
    viewerMode: userScope.viewerMode,
    workspaceItems,
    comments,
  };
}

function updateWorkspaceItemStatusFromComments(
  item: ClientWorkspaceItem,
  comments: ClientComment[],
): ClientWorkspaceItem {
  return {
    ...item,
    status: resolveWorkspaceItemStatus(item, comments),
  };
}
