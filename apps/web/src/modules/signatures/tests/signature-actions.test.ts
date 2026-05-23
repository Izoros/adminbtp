import { beforeEach, describe, expect, it, vi } from "vitest";

import { ScopeGuardError } from "@/lib/permissions";
import {
  buildSignatureTransitionLabel,
  mapStatusToAuditAction,
} from "@/modules/signatures/services/signature-action-helpers";
import {
  createSignatureRequestAction,
  initialSignatureMutationState,
  transitionSignatureRequestAction,
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
    assertOrganizationAccessMock.mockImplementation(() => undefined);
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

  it("prepare et persiste un payload WhatsApp a l'envoi en signature", async () => {
    const requestMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "signature_request_001",
        document_id: "document_001",
        organization_id: "org_adminbtp_001",
        requested_by: "user_001",
        approver_id: null,
        signature_profile_id: "signature_profile_001",
        status: "pending_internal_validation",
        validation_notes: "Pret pour envoi",
        whatsapp_payload: {},
        created_at: "2026-05-23T08:00:00.000Z",
        updated_at: "2026-05-23T08:00:00.000Z",
      },
      error: null,
    });
    const profileMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "signature_profile_001",
        organization_id: "org_adminbtp_001",
        label: "Visa chantier",
        signer_name: "Alice Martin",
        signer_role: "Architecte HMONP",
        signature_style: "typed",
        whatsapp_enabled: true,
        created_at: "2026-05-23T08:00:00.000Z",
        created_by: "user_001",
        updated_at: "2026-05-23T08:00:00.000Z",
      },
      error: null,
    });
    const documentMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "document_001",
        template_id: "template_001",
        title: "Compte rendu chantier",
        subject: "Objet",
        body_rendered: "Contenu",
        status: "validated",
        organization_id: "org_adminbtp_001",
        project_id: "project_001",
        metadata: {},
        created_at: "2026-05-23T08:00:00.000Z",
        created_by: "user_001",
        updated_at: "2026-05-23T08:00:00.000Z",
      },
      error: null,
    });
    const updateEqOrganization = vi.fn().mockResolvedValue({ error: null });
    const updateEqId = vi.fn(() => ({
      eq: updateEqOrganization,
    }));
    const update = vi.fn(() => ({
      eq: updateEqId,
    }));
    const auditInsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "signature_requests") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: requestMaybeSingle,
              })),
            })),
          })),
          update,
        };
      }

      if (table === "signature_profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: profileMaybeSingle,
              })),
            })),
          })),
        };
      }

      if (table === "documents") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: documentMaybeSingle,
              })),
            })),
          })),
        };
      }

      if (table === "audit_logs") {
        return {
          insert: auditInsert,
        };
      }

      throw new Error(`Table inattendue: ${table}`);
    });

    createClientMock.mockResolvedValue({ from });
    loadServerOrganizationScopeMock.mockResolvedValue({
      accessibleOrganizationIds: ["org_adminbtp_001"],
    });

    const formData = new FormData();
    formData.set("requestId", "signature_request_001");
    formData.set("organizationId", "org_adminbtp_001");
    formData.set("currentStatus", "pending_internal_validation");
    formData.set("nextStatus", "pending_signature");
    formData.set("actorUserId", "user_001");

    const result = await transitionSignatureRequestAction(
      initialSignatureMutationState,
      formData,
    );

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "pending_signature",
        whatsapp_payload: expect.objectContaining({
          channel: "whatsapp",
          requestId: "signature_request_001",
          documentTitle: "Compte rendu chantier",
          signerName: "Alice Martin",
        }),
      }),
    );
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          whatsapp_payload_ready: true,
          whatsapp_destination_status: "pending_configuration",
        }),
      }),
    );
    expect(result).toEqual({
      status: "success",
      mode: "supabase",
      message: "Demande de signature mise a jour vers pending_signature.",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/signatures");
    expect(revalidatePathMock).toHaveBeenCalledWith("/documents");
  });
});
