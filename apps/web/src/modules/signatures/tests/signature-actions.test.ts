import { beforeEach, describe, expect, it, vi } from "vitest";

import { ScopeGuardError } from "@/lib/permissions";
import {
  buildSignatureTransitionLabel,
  mapStatusToAuditAction,
} from "@/modules/signatures/services/signature-action-helpers";
import {
  createSignatureRequestAction,
  initialSignatureMutationState,
} from "@/modules/signatures/services/signature-actions";

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

describe("actions signatures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("associe un libelle metier a chaque transition", () => {
    expect(buildSignatureTransitionLabel("pending_signature")).toBe(
      "Signature externe preparee",
    );
    expect(buildSignatureTransitionLabel("approved")).toBe("Demande approuvee");
    expect(buildSignatureTransitionLabel("rejected")).toBe("Demande rejetee");
  });

  it("mappe le statut cible vers une action d'audit compatible", () => {
    expect(mapStatusToAuditAction("pending_signature")).toBe("signature_requested");
    expect(mapStatusToAuditAction("approved")).toBe("approved");
    expect(mapStatusToAuditAction("rejected")).toBe("rejected");
    expect(mapStatusToAuditAction("pending_internal_validation")).toBe("submitted");
  });

  it("refuse la creation si l'organisation sort du scope serveur", async () => {
    const formData = new FormData();
    formData.set("documentId", "document_001");
    formData.set("organizationId", "org_hors_scope");
    formData.set("signatureProfileId", "signature_profile_001");

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

    const result = await createSignatureRequestAction(
      initialSignatureMutationState,
      formData,
    );

    expect(result).toEqual({
      status: "error",
      mode: "supabase",
      message: "Le scope serveur courant ne couvre pas cette organisation.",
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
