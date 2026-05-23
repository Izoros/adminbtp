import { beforeEach, describe, expect, it, vi } from "vitest";

import { ScopeGuardError } from "@/lib/permissions";
import { buildInitialAiMutationState } from "@/modules/ai/services/ai-action-state";
import {
  applyAiSuggestionAction,
  reviewAiSuggestionAction,
} from "@/modules/ai/services/ai-actions";

const createClientMock = vi.fn();
const loadServerOrganizationScopeMock = vi.fn();
const assertOrganizationAccessMock = vi.fn();
const revalidatePathMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));

vi.mock("@/lib/permissions", async () => {
  const actual = await vi.importActual<typeof import("@/lib/permissions")>("@/lib/permissions");

  return {
    ...actual,
    loadServerOrganizationScope: (...args: unknown[]) =>
      loadServerOrganizationScopeMock(...args),
    assertOrganizationAccess: (...args: unknown[]) => assertOrganizationAccessMock(...args),
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

describe("actions ai", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadServerOrganizationScopeMock.mockResolvedValue({
      accessibleOrganizationIds: ["org_adminbtp_001"],
    });
    assertOrganizationAccessMock.mockImplementation(() => undefined);
  });

  it("approuve une suggestion IA et journalise la decision", async () => {
    const suggestionMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "ai_001",
        organization_id: "org_adminbtp_001",
      },
      error: null,
    });
    const updateEqOrganization = vi.fn().mockResolvedValue({ error: null });
    const updateEqId = vi.fn(() => ({
      eq: updateEqOrganization,
    }));
    const update = vi.fn(() => ({
      eq: updateEqId,
    }));
    const insertAudit = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "ai_suggestions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: suggestionMaybeSingle,
            })),
          })),
          update,
        };
      }

      if (table === "ai_suggestion_audit_logs") {
        return {
          insert: insertAudit,
        };
      }

      throw new Error(`Table inattendue: ${table}`);
    });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user_admin_001" } },
          error: null,
        }),
      },
      from,
    });

    const formData = new FormData();
    formData.set("suggestionId", "ai_001");
    formData.set("decision", "approved");

    const result = await reviewAiSuggestionAction(
      buildInitialAiMutationState(),
      formData,
    );

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "approved",
        validated_by: "user_admin_001",
      }),
    );
    expect(insertAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        ai_suggestion_id: "ai_001",
        action: "approved",
      }),
    );
    expect(result).toEqual({
      status: "success",
      mode: "supabase",
      message: "Suggestion IA approuvee dans Supabase.",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/ai");
  });

  it("refuse la revue si l'organisation sort du scope serveur", async () => {
    const suggestionMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "ai_001",
        organization_id: "org_interdite",
      },
      error: null,
    });
    const from = vi.fn((table: string) => {
      if (table === "ai_suggestions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: suggestionMaybeSingle,
            })),
          })),
        };
      }

      throw new Error(`Table inattendue: ${table}`);
    });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user_admin_001" } },
          error: null,
        }),
      },
      from,
    });
    assertOrganizationAccessMock.mockImplementation(() => {
      throw new ScopeGuardError(
        "organization_access_denied",
        "Le scope serveur courant ne couvre pas cette organisation.",
      );
    });

    const formData = new FormData();
    formData.set("suggestionId", "ai_001");
    formData.set("decision", "approved");

    const result = await reviewAiSuggestionAction(
      buildInitialAiMutationState(),
      formData,
    );

    expect(result).toEqual({
      status: "error",
      mode: "supabase",
      message: "Le scope serveur courant ne couvre pas cette organisation.",
    });
  });

  it("applique une suggestion IA approuvee avec audit", async () => {
    const suggestionMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "ai_001",
        organization_id: "org_adminbtp_001",
        output_payload: { summary: "Resume" },
        project_id: "project_001",
        prompt_snapshot: "Resumer le mail",
        proposed_by: "ai",
        source_entity_id: "email_001",
        source_entity_type: "email",
        status: "approved",
        suggestion_kind: "email_summary",
        title: "Resume IA",
        validated_at: "2026-05-23T10:00:00.000Z",
        validated_by: "user_admin_001",
        applied_at: null,
        created_at: "2026-05-23T09:00:00.000Z",
      },
      error: null,
    });
    const logsOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: "log_001",
          ai_suggestion_id: "ai_001",
          actor_type: "user",
          actor_id: "user_admin_001",
          action: "approved",
          details: { origin: "ai_page" },
          created_at: "2026-05-23T10:00:00.000Z",
        },
      ],
      error: null,
    });
    const updateEqOrganization = vi.fn().mockResolvedValue({ error: null });
    const updateEqId = vi.fn(() => ({
      eq: updateEqOrganization,
    }));
    const update = vi.fn(() => ({
      eq: updateEqId,
    }));
    const insertAudit = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "ai_suggestions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: suggestionMaybeSingle,
            })),
          })),
          update,
        };
      }

      if (table === "ai_suggestion_audit_logs") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: logsOrder,
            })),
          })),
          insert: insertAudit,
        };
      }

      throw new Error(`Table inattendue: ${table}`);
    });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user_operator_001" } },
          error: null,
        }),
      },
      from,
    });

    const formData = new FormData();
    formData.set("suggestionId", "ai_001");

    const result = await applyAiSuggestionAction(
      buildInitialAiMutationState(),
      formData,
    );

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "applied",
        applied_at: expect.any(String),
      }),
    );
    expect(insertAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        ai_suggestion_id: "ai_001",
        action: "applied",
        actor_id: "user_operator_001",
      }),
    );
    expect(result).toEqual({
      status: "success",
      mode: "supabase",
      message: "Suggestion IA appliquee dans Supabase.",
    });
  });

  it("bloque l'application si la suggestion n'est pas approuvee", async () => {
    const suggestionMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "ai_001",
        organization_id: "org_adminbtp_001",
        output_payload: { summary: "Resume" },
        project_id: "project_001",
        prompt_snapshot: "Resumer le mail",
        proposed_by: "ai",
        source_entity_id: "email_001",
        source_entity_type: "email",
        status: "pending_human_validation",
        suggestion_kind: "email_summary",
        title: "Resume IA",
        validated_at: null,
        validated_by: null,
        applied_at: null,
        created_at: "2026-05-23T09:00:00.000Z",
      },
      error: null,
    });
    const from = vi.fn((table: string) => {
      if (table === "ai_suggestions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: suggestionMaybeSingle,
            })),
          })),
        };
      }

      throw new Error(`Table inattendue: ${table}`);
    });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user_operator_001" } },
          error: null,
        }),
      },
      from,
    });

    const formData = new FormData();
    formData.set("suggestionId", "ai_001");

    const result = await applyAiSuggestionAction(
      buildInitialAiMutationState(),
      formData,
    );

    expect(result).toEqual({
      status: "error",
      mode: "supabase",
      message: "Une suggestion IA doit etre approuvee avant application.",
    });
  });
});
