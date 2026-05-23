import { beforeEach, describe, expect, it, vi } from "vitest";

import { ScopeGuardError } from "@/lib/permissions";
import { initialMailboxMutationState } from "@/modules/emails/services/mailbox-action-state";
import { createMailboxAction } from "@/modules/emails/services/mailbox-actions";

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

describe("actions boites generiques", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadServerOrganizationScopeMock.mockResolvedValue({
      accessibleOrganizationIds: ["org_adminbtp_001"],
    });
    assertOrganizationAccessMock.mockImplementation(() => undefined);
  });

  it("cree une boite generique dans Supabase", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "mailboxes") {
        return {
          insert,
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
    formData.set("organizationId", "org_adminbtp_001");
    formData.set("address", "client@adminbtp.yt");
    formData.set("displayName", "Boite client AdminBTP");
    formData.set("provider", "internal");

    const result = await createMailboxAction(initialMailboxMutationState, formData);

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org_adminbtp_001",
        address: "client@adminbtp.yt",
        display_name: "Boite client AdminBTP",
        provider: "internal",
        created_by: "user_admin_001",
      }),
    );
    expect(result).toEqual({
      status: "success",
      mode: "supabase",
      message: "Boite generique creee dans Supabase.",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/emails");
    expect(revalidatePathMock).toHaveBeenCalledWith("/n8n");
  });

  it("refuse la creation si l'organisation sort du scope serveur", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user_admin_001" } },
          error: null,
        }),
      },
      from: vi.fn(),
    });
    assertOrganizationAccessMock.mockImplementation(() => {
      throw new ScopeGuardError(
        "organization_access_denied",
        "Le scope serveur courant ne couvre pas cette organisation.",
      );
    });

    const formData = new FormData();
    formData.set("organizationId", "org_interdite");
    formData.set("address", "client@adminbtp.yt");
    formData.set("displayName", "Boite client AdminBTP");
    formData.set("provider", "internal");

    const result = await createMailboxAction(initialMailboxMutationState, formData);

    expect(result).toEqual({
      status: "error",
      mode: "supabase",
      message: "Le scope serveur courant ne couvre pas cette organisation.",
    });
  });
});
