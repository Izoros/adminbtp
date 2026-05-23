import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildDocumentVariablesFromFormData,
} from "@/modules/documents/services/document-action-helpers";
import {
  createDocumentAction,
  initialDocumentMutationState,
} from "@/modules/documents/services/document-actions";
import { ScopeGuardError } from "@/lib/permissions";

const createClientMock = vi.fn();
const loadServerOrganizationScopeMock = vi.fn();
const loadServerProjectScopeMock = vi.fn();
const assertOrganizationAccessMock = vi.fn();
const assertProjectAccessMock = vi.fn();
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
    loadServerProjectScope: (...args: unknown[]) => loadServerProjectScopeMock(...args),
    assertOrganizationAccess: (...args: unknown[]) => assertOrganizationAccessMock(...args),
    assertProjectAccess: (...args: unknown[]) => assertProjectAccessMock(...args),
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

describe("actions documentaires", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("construit les variables de rendu a partir du formulaire", () => {
    const formData = new FormData();
    formData.set("recipientName", "MOE Kaweni");
    formData.set("projectName", "Renovation college Kaweni");
    formData.set("meetingDate", "2026-05-22");
    formData.set("progressSummary", "Lots techniques coordonnes");
    formData.set("attentionPoint", "Visa facade a verifier");
    formData.set("nextDeadline", "2026-05-30");
    formData.set("senderName", "Equipe AdminBTP");

    expect(buildDocumentVariablesFromFormData(formData)).toEqual({
      recipient_name: "MOE Kaweni",
      project_name: "Renovation college Kaweni",
      meeting_date: "2026-05-22",
      progress_summary: "Lots techniques coordonnes",
      attention_point: "Visa facade a verifier",
      next_deadline: "2026-05-30",
      sender_name: "Equipe AdminBTP",
    });
  });

  it("retombe sur des valeurs par defaut quand le formulaire est incomplet", () => {
    const formData = new FormData();

    const variables = buildDocumentVariablesFromFormData(formData);

    expect(variables.recipient_name).toBe("Interlocuteur chantier");
    expect(variables.project_name).toBe("Projet non renseigne");
    expect(variables.sender_name).toBe("Equipe AdminBTP");
  });

  it("refuse la creation si l'organisation sort du scope serveur", async () => {
    const formData = new FormData();
    formData.set("templateId", "template_001");
    formData.set("organizationId", "org_hors_scope");

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

    const result = await createDocumentAction(initialDocumentMutationState, formData);

    expect(result).toEqual({
      status: "error",
      mode: "supabase",
      message: "Le scope serveur courant ne couvre pas cette organisation.",
    });
    expect(assertProjectAccessMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
