import { beforeEach, describe, expect, it, vi } from "vitest";

import { ScopeGuardError } from "@/lib/permissions";
import {
  updateEmailClassificationAction,
} from "@/modules/emails/services/email-actions";
import { initialEmailMutationState } from "@/modules/emails/services/email-action-state";

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

function buildEmailFormData() {
  const formData = new FormData();
  formData.set("emailId", "email_001");
  formData.set("organizationId", "org_adminbtp_001");
  formData.set("classification", "validation");
  formData.set("projectId", "project_002");
  formData.set("relatedTaskId", "task_validation_002");

  return formData;
}

describe("actions emails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertOrganizationAccessMock.mockImplementation(() => undefined);
  });

  it("bloque la reclassification si Supabase est indisponible", async () => {
    createClientMock.mockResolvedValue(null);

    const result = await updateEmailClassificationAction(
      initialEmailMutationState,
      buildEmailFormData(),
    );

    expect(result).toEqual({
      status: "error",
      mode: "supabase",
      emailId: "email_001",
      message:
        "Supabase indisponible. La reclassification email est bloquee en mode production.",
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("refuse la mise a jour si l'organisation sort du scope serveur", async () => {
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

    const result = await updateEmailClassificationAction(
      initialEmailMutationState,
      buildEmailFormData(),
    );

    expect(result).toEqual({
      status: "error",
      mode: "supabase",
      emailId: "email_001",
      message: "Le scope serveur courant ne couvre pas cette organisation.",
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("refuse une classification inconnue", async () => {
    createClientMock.mockResolvedValue({
      from: vi.fn(),
    });
    loadServerOrganizationScopeMock.mockResolvedValue({
      accessibleOrganizationIds: ["org_adminbtp_001"],
    });

    const formData = buildEmailFormData();
    formData.set("classification", "invalide");

    const result = await updateEmailClassificationAction(initialEmailMutationState, formData);

    expect(result).toEqual({
      status: "error",
      mode: "supabase",
      emailId: "email_001",
      message: "La classification email demandee n'est pas reconnue.",
    });
    expect(assertOrganizationAccessMock).not.toHaveBeenCalled();
  });

  it("persiste la reclassification et le rattachement metier dans Supabase", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "email_001" },
      error: null,
    });
    const select = vi.fn(() => ({
      maybeSingle,
    }));
    const eqOrganization = vi.fn(() => ({
      select,
    }));
    const eqId = vi.fn(() => ({
      eq: eqOrganization,
    }));
    const update = vi.fn(() => ({
      eq: eqId,
    }));
    const from = vi.fn(() => ({
      update,
    }));

    createClientMock.mockResolvedValue({
      from,
    });
    loadServerOrganizationScopeMock.mockResolvedValue({
      accessibleOrganizationIds: ["org_adminbtp_001"],
    });

    const result = await updateEmailClassificationAction(
      initialEmailMutationState,
      buildEmailFormData(),
    );

    expect(update).toHaveBeenCalledWith({
      classification: "validation",
      project_id: "project_002",
      related_task_id: "task_validation_002",
    });
    expect(eqId).toHaveBeenCalledWith("id", "email_001");
    expect(eqOrganization).toHaveBeenCalledWith("organization_id", "org_adminbtp_001");
    expect(revalidatePathMock).toHaveBeenCalledWith("/emails");
    expect(result).toEqual({
      status: "success",
      mode: "supabase",
      emailId: "email_001",
      message: "Classification et rattachement email enregistres dans Supabase.",
    });
  });
});
