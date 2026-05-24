import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildDemoClientSpaceData,
  buildEmptyClientSpaceData,
  formatClientDecisionMessage,
  inferWorkspaceItemType,
  loadClientSpaceData,
  mapClientFeedbackThreadRow,
  mapClientPortalAccessRow,
  parseClientDecisionMessage,
  resolvePreferredOrganizationId,
  sanitizeClientCommentDraft,
} from "@/modules/client-space/services/client-space-data";
import type { SupabaseDatabase } from "@/types/supabase";

type ClientSpaceTables = SupabaseDatabase["public"]["Tables"];

const loadServerOrganizationScopeMock = vi.fn();

vi.mock("@/lib/permissions", async () => {
  const actual = await vi.importActual<typeof import("@/lib/permissions")>("@/lib/permissions");

  return {
    ...actual,
    loadServerOrganizationScope: (...args: unknown[]) =>
      loadServerOrganizationScopeMock(...args),
  };
});

describe("client-space-data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadServerOrganizationScopeMock.mockReset();
  });

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

  it("code et decode une decision client dans le fil d'echange", () => {
    const encodedMessage = formatClientDecisionMessage({
      decision: "approved",
      message: "Validation du courrier apres correction.",
    });

    expect(encodedMessage).toBe(
      "[[decision:approved]] Validation du courrier apres correction.",
    );
    expect(parseClientDecisionMessage(encodedMessage)).toEqual({
      decision: "approved",
      visibleMessage: "Validation du courrier apres correction.",
    });
  });

  it("retourne un etat vide Supabase pour un viewer sans element", () => {
    const data = buildEmptyClientSpaceData("client", "org_client_010");

    expect(data.source).toBe("supabase");
    expect(data.viewerMode).toBe("client");
    expect(data.workspaceItems).toHaveLength(0);
  });

  it("retourne un etat Supabase vide honnete quand aucun acces actif n'existe", async () => {
    loadServerOrganizationScopeMock.mockResolvedValue({
      preferredOrganizationId: "org_adminbtp_001",
      accessibleOrganizationIds: ["org_adminbtp_001"],
    });

    const supabase = createSupabaseClientMock({
      user: {
        id: "user_001",
      },
      profile: {
        created_at: "2026-05-22T08:00:00.000Z",
        default_organization_id: "org_adminbtp_001",
        email: "user@example.com",
        full_name: "User",
        id: "user_001",
        internal_role: "member",
        updated_at: "2026-05-22T08:00:00.000Z",
      },
      accessRows: [],
    });

    const data = await loadClientSpaceData(supabase);

    expect(data).toEqual({
      source: "supabase",
      clientOrganizationId: "org_adminbtp_001",
      viewerMode: "internal",
      workspaceItems: [],
      comments: [],
    });
  });

  it("retourne un etat Supabase vide honnete quand le scope authentifie ne voit rien", async () => {
    loadServerOrganizationScopeMock.mockResolvedValue({
      preferredOrganizationId: "org_adminbtp_001",
      accessibleOrganizationIds: ["org_adminbtp_001"],
    });

    const supabase = createSupabaseClientMock({
      user: {
        id: "user_001",
      },
      profile: {
        created_at: "2026-05-22T08:00:00.000Z",
        default_organization_id: "org_adminbtp_001",
        email: "user@example.com",
        full_name: "User",
        id: "user_001",
        internal_role: "member",
        updated_at: "2026-05-22T08:00:00.000Z",
      },
      accessRows: [
        {
          access_scope: "validation_document",
          client_organization_id: "org_client_010",
          created_at: "2026-05-22T08:00:00.000Z",
          id: "access_001",
          is_active: true,
          organization_id: "org_hors_scope",
          project_id: "project_001",
        },
      ],
    });

    const data = await loadClientSpaceData(supabase);

    expect(data).toEqual({
      source: "supabase",
      clientOrganizationId: "org_adminbtp_001",
      viewerMode: "internal",
      workspaceItems: [],
      comments: [],
    });
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

function createSupabaseClientMock(input: {
  user: { id: string } | null;
  profile: ClientSpaceTables["user_profiles"]["Row"] | null;
  accessRows: ClientSpaceTables["client_portal_accesses"]["Row"][];
  feedbackRows?: ClientSpaceTables["client_feedback_threads"]["Row"][];
}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: input.user,
        },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === "user_profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: input.profile,
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === "client_portal_accesses") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: input.accessRows,
                  error: null,
                }),
              })),
            })),
          })),
        };
      }

      if (table === "client_feedback_threads") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: input.feedbackRows ?? [],
                  error: null,
                }),
              })),
            })),
          })),
        };
      }

      throw new Error(`Table inattendue: ${table}`);
    }),
  } as unknown as Parameters<typeof loadClientSpaceData>[0];
}
