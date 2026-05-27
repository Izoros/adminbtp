import { beforeEach, describe, expect, it, vi } from "vitest";

import { createOrganizationAction } from "@/app/organizations/actions";

const createClientMock = vi.fn();
const revalidatePathMock = vi.fn();
const redirectMock = vi.fn();

class RedirectSignal extends Error {
  constructor(readonly location: string) {
    super(`REDIRECT:${location}`);
  }
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));

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

function buildOrganizationFormData() {
  const formData = new FormData();
  formData.set("name", "AdminBTP Conseil");
  formData.set("slug", "adminbtp-conseil");
  formData.set("legalName", "AdminBTP Conseil SAS");
  return formData;
}

describe("createOrganizationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirige en erreur si Supabase est indisponible", async () => {
    createClientMock.mockResolvedValue(null);

    await expectRedirect(
      createOrganizationAction(buildOrganizationFormData()),
      "/organizations?organizationError=Supabase%20indisponible.%20La%20creation%20d'organisation%20est%20bloquee%20en%20mode%20production.",
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
      createOrganizationAction(buildOrganizationFormData()),
      "/organizations?organizationError=Session%20Supabase%20indisponible.%20Connectez-vous%20pour%20creer%20une%20organisation%20reelle.",
    );
  });

  it("redirige avec le message fonctionnel si le formulaire est invalide", async () => {
    const formData = new FormData();
    formData.set("slug", "org-invalide");

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user_001" } },
          error: null,
        }),
      },
    });

    await expectRedirect(
      createOrganizationAction(formData),
      "/organizations?organizationError=Le%20nom%20de%20l'organisation%20est%20obligatoire.",
    );
  });

  it("redirige avec le message RPC si la creation echoue", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      error: {
        message: "slug deja utilise",
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

    await expectRedirect(
      createOrganizationAction(buildOrganizationFormData()),
      "/organizations?organizationError=Creation%20impossible%3A%20slug%20deja%20utilise",
    );

    expect(rpcMock).toHaveBeenCalledWith("create_organization_with_owner", {
      target_name: "AdminBTP Conseil",
      target_slug: "adminbtp-conseil",
      target_legal_name: "AdminBTP Conseil SAS",
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("revalide les vues puis redirige en succes quand la creation aboutit", async () => {
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

    await expectRedirect(
      createOrganizationAction(buildOrganizationFormData()),
      "/organizations?organizationStatus=created",
    );

    expect(revalidatePathMock).toHaveBeenNthCalledWith(1, "/organizations");
    expect(revalidatePathMock).toHaveBeenNthCalledWith(2, "/projects");
  });
});
