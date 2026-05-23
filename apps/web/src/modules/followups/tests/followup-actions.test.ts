import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getFollowupFeedbackFromSearchParams,
  syncFollowupScheduleAction,
  updateFollowupStatusAction,
} from "@/modules/followups/services/followup-actions";
import { createClient } from "@/lib/supabase/server";
import {
  assertOrganizationAccess,
  loadServerOrganizationScope,
  ScopeGuardError,
} from "@/lib/permissions";

const revalidatePathMock = vi.fn();
const redirectMock = vi.fn();

class RedirectSignal extends Error {
  constructor(readonly location: string) {
    super(`REDIRECT:${location}`);
  }
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/permissions", async () => {
  const actual = await vi.importActual<typeof import("@/lib/permissions")>("@/lib/permissions");

  return {
    ...actual,
    assertOrganizationAccess: vi.fn(),
    loadServerOrganizationScope: vi.fn(),
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

async function expectRedirect(callback: Promise<unknown>, expectedLocation: string) {
  await expect(callback).rejects.toMatchObject({
    location: expectedLocation,
  });
  expect(redirectMock).toHaveBeenCalledWith(expectedLocation);
}

function buildSyncFormData() {
  const formData = new FormData();
  formData.set("situationId", "situation_001");
  formData.set("organizationId", "org_adminbtp_001");
  formData.set("returnTo", "/followups?organizationId=org_adminbtp_001");
  return formData;
}

function buildStatusFormData() {
  const formData = new FormData();
  formData.set("followupId", "followup_001");
  formData.set("organizationId", "org_adminbtp_001");
  formData.set("nextStatus", "sent");
  formData.set("returnTo", "/followups?situationId=situation_001");
  return formData;
}

describe("followup-actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(assertOrganizationAccess).mockImplementation(
      (_scope, organizationId) => organizationId ?? "",
    );
  });

  it("redirige en information si Supabase est indisponible pendant la synchronisation", async () => {
    vi.mocked(createClient).mockResolvedValue(null);

    await expectRedirect(
      syncFollowupScheduleAction(buildSyncFormData()),
      "/followups?organizationId=org_adminbtp_001&followupInfo=Supabase+indisponible.+La+synchronisation+des+relances+reste+simulee.",
    );

    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("refuse la synchronisation si l'organisation sort du scope serveur", async () => {
    vi.mocked(createClient).mockResolvedValue({} as never);
    vi.mocked(loadServerOrganizationScope).mockResolvedValue({
      accessibleOrganizationIds: ["org_adminbtp_001"],
      preferredOrganizationId: "org_adminbtp_001",
      memberships: [],
      userId: "user_001",
      internalRole: "member",
    });
    vi.mocked(assertOrganizationAccess).mockImplementation(() => {
      throw new ScopeGuardError(
        "organization_access_denied",
        "Le scope serveur courant ne couvre pas cette organisation.",
      );
    });

    await expectRedirect(
      syncFollowupScheduleAction(buildSyncFormData()),
      "/followups?organizationId=org_adminbtp_001&followupError=Le+scope+serveur+courant+ne+couvre+pas+cette+organisation.",
    );
  });

  it("remplace le planning persiste puis revalide la page", async () => {
    const situationSelect = {
      select: vi.fn(() => situationSelect),
      eq: vi.fn(() => situationSelect),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "situation_001",
          amount_cents: 245000,
          created_at: "2026-05-10T00:00:00.000Z",
          created_by: "user_001",
          currency_code: "EUR",
          customer_name: "Collectivite Client College",
          due_on: "2026-05-20",
          issued_on: "2026-05-10",
          organization_id: "org_adminbtp_001",
          project_id: "project_001",
          reference: "SIT-2026-05-001",
          status: "sent",
          updated_at: "2026-05-10T00:00:00.000Z",
        },
        error: null,
      }),
    };
    const deleteChain = {
      delete: vi.fn(() => deleteChain),
      eq: vi.fn(() => deleteChain),
      error: null,
      then: undefined,
    };
    const deleteEq = vi
      .fn()
      .mockReturnValueOnce(deleteChain)
      .mockResolvedValueOnce({ error: null });
    deleteChain.eq = deleteEq;
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "situations") {
        return situationSelect;
      }

      if (table === "payment_followups") {
        return {
          delete: deleteChain.delete,
          insert: insertMock,
        };
      }

      throw new Error(`Table inattendue: ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue({ from } as never);
    vi.mocked(loadServerOrganizationScope).mockResolvedValue({
      accessibleOrganizationIds: ["org_adminbtp_001"],
      preferredOrganizationId: "org_adminbtp_001",
      memberships: [],
      userId: "user_001",
      internalRole: "member",
    });

    await expectRedirect(
      syncFollowupScheduleAction(buildSyncFormData()),
      "/followups?organizationId=org_adminbtp_001&followupStatus=Le+planning+de+relance+a+ete+persiste+dans+Supabase.",
    );

    expect(deleteEq).toHaveBeenNthCalledWith(1, "situation_id", "situation_001");
    expect(deleteEq).toHaveBeenNthCalledWith(2, "organization_id", "org_adminbtp_001");
    expect(insertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          situation_id: "situation_001",
          organization_id: "org_adminbtp_001",
          days_after_due: 7,
          status: "scheduled",
        }),
      ]),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/followups");
  });

  it("met a jour le statut d'une relance persistante", async () => {
    const updateChain = {
      update: vi.fn(() => updateChain),
      eq: vi.fn(() => updateChain),
      error: null,
      then: undefined,
    };
    const updateEq = vi
      .fn()
      .mockReturnValueOnce(updateChain)
      .mockResolvedValueOnce({ error: null });
    updateChain.eq = updateEq;
    const from = vi.fn(() => ({
      update: updateChain.update,
    }));

    vi.mocked(createClient).mockResolvedValue({ from } as never);
    vi.mocked(loadServerOrganizationScope).mockResolvedValue({
      accessibleOrganizationIds: ["org_adminbtp_001"],
      preferredOrganizationId: "org_adminbtp_001",
      memberships: [],
      userId: "user_001",
      internalRole: "member",
    });

    await expectRedirect(
      updateFollowupStatusAction(buildStatusFormData()),
      "/followups?situationId=situation_001&followupStatus=Le+statut+de+la+relance+est+maintenant+sent.",
    );

    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "sent",
      }),
    );
    expect(updateEq).toHaveBeenNthCalledWith(1, "id", "followup_001");
    expect(updateEq).toHaveBeenNthCalledWith(2, "organization_id", "org_adminbtp_001");
    expect(revalidatePathMock).toHaveBeenCalledWith("/followups");
  });

  it("lit correctement le feedback depuis les query params", () => {
    expect(
      getFollowupFeedbackFromSearchParams({
        followupStatus: "Planning mis a jour.",
      }),
    ).toEqual({
      tone: "success",
      message: "Planning mis a jour.",
    });
  });
});
