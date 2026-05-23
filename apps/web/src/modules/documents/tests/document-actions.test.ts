import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildDocumentVariablesFromFormData,
} from "@/modules/documents/services/document-action-helpers";
import {
  createDocumentAction,
  initialDocumentMutationState,
  regenerateDocumentAction,
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
    createClientMock.mockReset();
    loadServerOrganizationScopeMock.mockReset();
    loadServerProjectScopeMock.mockReset();
    assertOrganizationAccessMock.mockReset();
    assertProjectAccessMock.mockReset();
    revalidatePathMock.mockReset();
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

  it("regenere un document existant dans Supabase", async () => {
    const templateMaybeSingleMock = vi.fn().mockResolvedValue({
      data: {
        id: "template_001",
        organization_id: "org_001",
        code: "cr",
        name: "Compte rendu chantier",
        subject: "CR - {{project_name}}",
        body_template: "Bonjour {{recipient_name}}",
        letterhead_name: "Entete test",
        logo_url: null,
        stamp_label: null,
        signature_label: null,
        created_at: "2026-05-23T10:00:00.000Z",
        created_by: "user_001",
        updated_at: "2026-05-23T10:00:00.000Z",
      },
      error: null,
    });
    const documentsEqMock = vi.fn().mockResolvedValue({
      error: null,
    });
    const documentsUpdateMock = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: documentsEqMock,
      })),
    }));

    createClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "document_templates") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: templateMaybeSingleMock,
                })),
              })),
            })),
          };
        }

        if (table === "documents") {
          return {
            update: documentsUpdateMock,
          };
        }

        throw new Error(`Table inattendue: ${table}`);
      }),
    });
    loadServerOrganizationScopeMock.mockResolvedValue({
      accessibleOrganizationIds: ["org_001"],
    });

    const formData = new FormData();
    formData.set("documentId", "document_001");
    formData.set("templateId", "template_001");
    formData.set("organizationId", "org_001");
    formData.set("recipientName", "MOE Kaweni");
    formData.set("projectName", "College de Kaweni");

    const result = await regenerateDocumentAction(initialDocumentMutationState, formData);

    expect(result).toEqual({
      status: "success",
      mode: "supabase",
      message: "Document regenere dans Supabase et apercu revalide.",
    });
    expect(documentsUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("College de Kaweni"),
        subject: expect.stringContaining("College de Kaweni"),
        body_rendered: expect.stringContaining("MOE Kaweni"),
        metadata: {
          variables: expect.objectContaining({
            recipient_name: "MOE Kaweni",
            project_name: "College de Kaweni",
          }),
        },
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/documents");
    expect(revalidatePathMock).toHaveBeenCalledWith("/signatures");
    expect(revalidatePathMock).toHaveBeenCalledWith("/client-space");
  });

  it("refuse la regeneration si le projet sort du scope serveur", async () => {
    const formData = new FormData();
    formData.set("documentId", "document_001");
    formData.set("templateId", "template_001");
    formData.set("organizationId", "org_001");
    formData.set("projectId", "project_hors_scope");

    createClientMock.mockResolvedValue({
      from: vi.fn(),
    });
    loadServerOrganizationScopeMock.mockResolvedValue({
      accessibleOrganizationIds: ["org_001"],
    });
    loadServerProjectScopeMock.mockResolvedValue({
      manageableProjectIds: ["project_autorise"],
    });
    assertProjectAccessMock.mockImplementation(() => {
      throw new ScopeGuardError(
        "project_access_denied",
        "Le scope projet courant ne couvre pas ce chantier.",
      );
    });

    const result = await regenerateDocumentAction(initialDocumentMutationState, formData);

    expect(result).toEqual({
      status: "error",
      mode: "supabase",
      message: "Le scope projet courant ne couvre pas ce chantier.",
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
