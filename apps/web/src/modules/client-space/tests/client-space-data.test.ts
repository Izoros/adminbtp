import { describe, expect, it } from "vitest";

import {
  buildDemoClientSpaceData,
  buildEmptyClientSpaceData,
  inferWorkspaceItemType,
  mapClientFeedbackThreadRow,
  mapClientPortalAccessRow,
  resolvePreferredOrganizationId,
  sanitizeClientCommentDraft,
} from "@/modules/client-space/services/client-space-data";
import type { SupabaseDatabase } from "@/types/supabase";

type ClientSpaceTables = SupabaseDatabase["public"]["Tables"];

describe("client-space-data", () => {
  it("replie sur le client de demonstration", () => {
    const data = buildDemoClientSpaceData();

    expect(data.source).toBe("demo");
    expect(data.clientOrganizationId).toBe("org_client_004");
    expect(data.viewerMode).toBe("demo");
  });

  it("deduit un type metier depuis le scope d acces", () => {
    expect(inferWorkspaceItemType("validation_document")).toBe("validation");
    expect(inferWorkspaceItemType("followup_relance")).toBe("followup");
    expect(inferWorkspaceItemType("ticket_support")).toBe("ticket");
    expect(inferWorkspaceItemType("documents_partages")).toBe("document");
  });

  it("mappe les acces et commentaires Supabase vers l espace client", () => {
    const accessRow: ClientSpaceTables["client_portal_accesses"]["Row"] = {
      access_scope: "validation_document",
      client_organization_id: "org_client_010",
      created_at: "2026-05-22T08:00:00.000Z",
      id: "access_001",
      is_active: true,
      organization_id: "org_adminbtp_001",
      project_id: "project_001",
    };
    const feedbackRow: ClientSpaceTables["client_feedback_threads"]["Row"] = {
      author_role: "client",
      client_organization_id: "org_client_010",
      created_at: "2026-05-22T09:00:00.000Z",
      id: "thread_001",
      message: "Merci de corriger le lot facade.",
      organization_id: "org_adminbtp_001",
      project_id: "project_001",
      related_entity_id: "access_001",
      related_entity_type: "validation",
    };

    expect(mapClientPortalAccessRow(accessRow).type).toBe("validation");
    expect(mapClientFeedbackThreadRow(feedbackRow).workspaceItemId).toBe("access_001");
  });

  it("retourne un etat vide Supabase pour un viewer sans element", () => {
    const data = buildEmptyClientSpaceData("client", "org_client_010");

    expect(data.source).toBe("supabase");
    expect(data.viewerMode).toBe("client");
    expect(data.workspaceItems).toHaveLength(0);
  });

  it("priorise l organisation par defaut si elle reste accessible", () => {
    expect(
      resolvePreferredOrganizationId(
        {
          created_at: "2026-05-22T08:00:00.000Z",
          default_organization_id: "org_b",
          email: "user@example.com",
          full_name: "User",
          id: "user_001",
          internal_role: "member",
          updated_at: "2026-05-22T08:00:00.000Z",
        },
        ["org_a", "org_b"],
      ),
    ).toBe("org_b");
  });

  it("normalise un commentaire client minimal", () => {
    expect(
      sanitizeClientCommentDraft({
        message: "  Retour client a prendre en compte. ",
      }),
    ).toBe("Retour client a prendre en compte.");
    expect(sanitizeClientCommentDraft({ message: "   " })).toBeNull();
  });
});
