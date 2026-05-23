import { beforeEach, describe, expect, it, vi } from "vitest";

import { ScopeGuardError } from "@/lib/permissions";
import {
  addCommentAction,
  initialClientSpaceMutationState,
  submitWorkspaceDecisionAction,
} from "@/modules/client-space/services/client-space-actions";
import type { ClientSpaceData } from "@/modules/client-space/services/client-space-data";

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

const clientSpaceData: ClientSpaceData = {
  source: "supabase",
  clientOrganizationId: "org_client_001",
  viewerMode: "internal",
  workspaceItems: [
    {
      id: "workspace_001",
      organizationId: "org_hors_scope",
      clientOrganizationId: "org_client_001",
      projectId: "project_001",
      type: "validation",
      accessScope: "validation_document",
      title: "Validation DGD",
      summary: "Validation client sur le dossier DGD.",
      status: "pending",
    },
  ],
  comments: [],
};

describe("actions client-space", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuse la creation si l'organisation sort du scope serveur", async () => {
    const formData = new FormData();
    formData.set("workspaceItemId", "workspace_001");
    formData.set("message", "Merci de verifier la derniere piece.");

    createClientMock.mockResolvedValue({
      from: vi.fn(),
    });
    loadServerOrganizationScopeMock.mockResolvedValue({
      accessibleOrganizationIds: ["org_autorisee"],
    });
    assertOrganizationAccessMock.mockImplementation(() => {
      throw new ScopeGuardError(
        "organization_access_denied",
        "Le scope serveur courant ne couvre pas cette organisation.",
      );
    });

    const result = await addCommentAction(clientSpaceData, formData);

    expect(result).toEqual({
      status: "error",
      mode: "supabase",
      message: "Le scope serveur courant ne couvre pas cette organisation.",
    });
    expect(initialClientSpaceMutationState.status).toBe("idle");
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("enregistre une validation client reelle dans Supabase", async () => {
    const formData = new FormData();
    const insertMock = vi.fn().mockResolvedValue({ error: null });

    formData.set("workspaceItemId", "workspace_001");
    formData.set("decision", "approved");
    formData.set("message", "Validation apres verification.");

    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({
        insert: insertMock,
      })),
    });
    loadServerOrganizationScopeMock.mockResolvedValue({
      accessibleOrganizationIds: ["org_hors_scope"],
    });
    assertOrganizationAccessMock.mockImplementation(() => undefined);

    const result = await submitWorkspaceDecisionAction(clientSpaceData, formData);

    expect(result).toEqual({
      status: "success",
      mode: "supabase",
      message: "Decision client enregistree : validation.",
    });
    expect(insertMock).toHaveBeenCalledWith({
      organization_id: "org_hors_scope",
      client_organization_id: "org_client_001",
      project_id: "project_001",
      related_entity_id: "workspace_001",
      related_entity_type: "validation",
      author_role: "adminbtp",
      message: "[[decision:approved]] Validation apres verification.",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/client-space");
  });

  it("refuse une decision invalide sur l'element courant", async () => {
    const formData = new FormData();

    formData.set("workspaceItemId", "workspace_001");
    formData.set("decision", "archived");

    const result = await submitWorkspaceDecisionAction(clientSpaceData, formData);

    expect(result).toEqual({
      status: "error",
      mode: "demo",
      message: "Impossible d'enregistrer cette decision client sur l'element courant.",
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
