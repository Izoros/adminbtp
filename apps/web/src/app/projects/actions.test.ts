import { beforeEach, describe, expect, it, vi } from "vitest";

import { createProjectAction } from "@/app/projects/actions";

const createClientMock = vi.fn();
const revalidatePathMock = vi.fn();
const redirectMock = vi.fn();
const loadServerOrganizationScopeMock = vi.fn();
const canManageOrganizationMock = vi.fn();

class RedirectSignal extends Error {
  constructor(readonly location: string) {
    super(`REDIRECT:${location}`);
  }
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));

vi.mock("@/lib/permissions", async () => {
  const actual = await vi.importActual<typeof import("@/lib/permissions")>("@/lib/permissions");

  return {
    ...actual,
    loadServerOrganizationScope: (...args: unknown[]) =>
      loadServerOrganizationScopeMock(...args),
    canManageOrganization: (...args: unknown[]) => canManageOrganizationMock(...args),
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (location: string) => {
    redirectMock(location);
    throw new RedirectSignal(location);
  },
}));

async function expectRedirect(
  callback: Promise<unknown>,
  expectedLocation: string,
) {
  await expect(callback).rejects.toMatchObject({
    location: expectedLocation,
  });
  expect(redirectMock).toHaveBeenCalledWith(expectedLocation);
}

function buildProjectFormData() {
  const formData = new FormData();
  formData.set("ownerOrganizationId", "org_001");
  formData.set("name", "Construction college Kaweni");
  formData.set("code", "KAW-001");
  formData.set("slug", "construction-college-kaweni");
  formData.set("description", "Operation pilote TCE");
  formData.set("status", "active");
  formData.set("role", "tce");
  formData.set("startsOn", "2026-05-01");
  formData.set("endsOn", "2026-12-31");
  return formData;
}

describe("createProjectAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirige en erreur si Supabase est indisponible", async () => {
    createClientMock.mockResolvedValue(null);

    await expectRedirect(
      createProjectAction(buildProjectFormData()),
      "/projects?projectError=Supabase%20indisponible.%20La%20creation%20de%20chantier%20est%20bloquee%20en%20mode%20production.",
    );

    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("redirige vers une erreur si la session est absente", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });

    await expectRedirect(
      createProjectAction(buildProjectFormData()),
      "/projects?projectError=Session%20Supabase%20indisponible.%20Connectez-vous%20pour%20creer%20un%20chantier%20reel.",
    );
  });

  it("redirige avec le message fonctionnel si le formulaire est invalide", async () => {
    const formData = buildProjectFormData();
    formData.set("ownerOrganizationId", "");

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user_001" } },
          error: null,
        }),
      },
    });

    await expectRedirect(
      createProjectAction(formData),
      "/projects?projectError=L'organisation%20proprietaire%20est%20obligatoire.",
    );
  });

  it("redirige si le scope organisation est introuvable", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user_001" } },
          error: null,
        }),
      },
    });
    loadServerOrganizationScopeMock.mockResolvedValue(null);

    await expectRedirect(
      createProjectAction(buildProjectFormData()),
      "/projects?projectError=Le%20scope%20organisation%20de%20la%20session%20est%20introuvable.%20Reconnectez-vous%20avant%20de%20creer%20un%20chantier.",
    );
  });

  it("redirige si l'organisation cible sort du perimetre gerable", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user_001" } },
          error: null,
        }),
      },
    });
    loadServerOrganizationScopeMock.mockResolvedValue({
      accessibleOrganizationIds: ["org_002"],
    });
    canManageOrganizationMock.mockReturnValue(false);

    await expectRedirect(
      createProjectAction(buildProjectFormData()),
      "/projects?projectError=Vous%20ne%20pouvez%20pas%20creer%20un%20chantier%20pour%20cette%20organisation.",
    );
  });

  it("redirige avec le message RPC si la creation echoue", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      error: {
        message: "code chantier deja utilise",
      },
    });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user_001" } },
          error: null,
        }),
      },
      rpc: rpcMock,
    });
    loadServerOrganizationScopeMock.mockResolvedValue({
      accessibleOrganizationIds: ["org_001"],
    });
    canManageOrganizationMock.mockReturnValue(true);

    await expectRedirect(
      createProjectAction(buildProjectFormData()),
      "/projects?projectError=Creation%20impossible%3A%20code%20chantier%20deja%20utilise",
    );

    expect(rpcMock).toHaveBeenCalledWith("create_project_with_owner_role", {
      target_owner_organization_id: "org_001",
      target_code: "KAW-001",
      target_slug: "construction-college-kaweni",
      target_name: "Construction college Kaweni",
      target_description: "Operation pilote TCE",
      target_status: "active",
      target_role: "tce",
      target_starts_on: "2026-05-01",
      target_ends_on: "2026-12-31",
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("revalide la page projets puis redirige en succes", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      error: null,
    });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user_001" } },
          error: null,
        }),
      },
      rpc: rpcMock,
    });
    loadServerOrganizationScopeMock.mockResolvedValue({
      accessibleOrganizationIds: ["org_001"],
    });
    canManageOrganizationMock.mockReturnValue(true);

    await expectRedirect(
      createProjectAction(buildProjectFormData()),
      "/projects?projectStatus=created",
    );

    expect(revalidatePathMock).toHaveBeenCalledWith("/projects");
  });
});
