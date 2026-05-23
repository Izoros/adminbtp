import { beforeEach, describe, expect, it, vi } from "vitest";

import { ScopeGuardError } from "@/lib/permissions";
import {
  addCommentAction,
  initialClientSpaceMutationState,
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
});
