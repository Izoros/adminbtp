import {
  buildDemoSignatureWorkflowData,
  buildSignatureWorkflowDataFromRows,
  extractWhatsappSummary,
  mapAuditLogRow,
  mapSignatureProfileRow,
  mapSignatureRequestRow,
  normalizeWhatsappPayload,
} from "@/modules/signatures/services/signature-data";
import type { Tables } from "@/types/supabase";

describe("alimentation signatures", () => {
  it("mappe un profil de signature Supabase vers le modele UI", () => {
    const row: Tables<"signature_profiles"> = {
      id: "signature_profile_supabase_001",
      organization_id: "org_001",
      label: "Visa chantier",
      signer_name: "Alice Martin",
      signer_role: "Architecte HMONP",
      signature_style: "typed",
      whatsapp_enabled: true,
      created_at: "2026-05-22T00:00:00.000Z",
      created_by: "user_001",
      updated_at: "2026-05-22T00:00:00.000Z",
    };

    expect(mapSignatureProfileRow(row)).toMatchObject({
      signerName: "Alice Martin",
      signerRole: "Architecte HMONP",
    });
  });

  it("mappe une demande de signature Supabase vers le modele UI", () => {
    const row: Tables<"signature_requests"> = {
      id: "signature_request_supabase_001",
      document_id: "document_001",
      organization_id: "org_001",
      requested_by: "user_001",
      approver_id: "user_002",
      signature_profile_id: "signature_profile_supabase_001",
      status: "pending_signature",
      validation_notes: "Pret pour envoi",
      whatsapp_payload: {},
      created_at: "2026-05-22T00:00:00.000Z",
      updated_at: "2026-05-22T00:00:00.000Z",
    };

    expect(mapSignatureRequestRow(row)).toMatchObject({
      id: "signature_request_supabase_001",
      approverId: "user_002",
      status: "pending_signature",
      whatsappPayload: null,
    });
  });

  it("remonte le contexte du document quand il est disponible", () => {
    const row: Tables<"signature_requests"> = {
      id: "signature_request_supabase_001",
      document_id: "document_001",
      organization_id: "org_001",
      requested_by: "user_001",
      approver_id: "user_002",
      signature_profile_id: "signature_profile_supabase_001",
      status: "pending_signature",
      validation_notes: "Pret pour envoi",
      whatsapp_payload: {},
      created_at: "2026-05-22T00:00:00.000Z",
      updated_at: "2026-05-22T00:00:00.000Z",
    };
    const documentRow: Tables<"documents"> = {
      id: "document_001",
      template_id: "template_001",
      title: "CR chantier MOE",
      subject: "Objet chantier",
      body_rendered: "Contenu",
      status: "validated",
      organization_id: "org_001",
      project_id: "project_001",
      metadata: {},
      created_at: "2026-05-22T00:00:00.000Z",
      created_by: "user_001",
      updated_at: "2026-05-22T00:00:00.000Z",
    };

    expect(mapSignatureRequestRow(row, documentRow)).toMatchObject({
      documentTitle: "CR chantier MOE",
      documentStatus: "validated",
    });
  });

  it("recupere un libelle d'audit depuis details quand il existe", () => {
    const row: Tables<"audit_logs"> = {
      id: "audit_001",
      organization_id: "org_001",
      entity_type: "signature_request",
      entity_id: "signature_request_supabase_001",
      action_type: "approved",
      actor_user_id: "user_001",
      created_at: "2026-05-22T00:00:00.000Z",
      details: { label: "Validation finale" },
    };

    expect(mapAuditLogRow(row).label).toBe("Validation finale");
    expect(mapAuditLogRow(row).createdAt).toBe("2026-05-22T00:00:00.000Z");
  });

  it("extrait un resume WhatsApp exploitable", () => {
    expect(
      extractWhatsappSummary({
        message: "Merci de valider le document avant 18h.",
      }),
    ).toBe("Merci de valider le document avant 18h.");
  });

  it("normalise un payload WhatsApp persiste en objet metier fiable", () => {
    const normalized = normalizeWhatsappPayload(
      {
        channel: "whatsapp",
        destination: "+262639000000",
        destinationStatus: "pending_configuration",
        template: "signature_validation_v1",
        requestId: "signature_request_supabase_009",
        organizationId: "org_001",
        documentId: "document_009",
        documentTitle: "Ordre de service",
        documentStatus: "validated",
        signatureProfileLabel: "Visa chantier",
        signerName: "Alice Martin",
        signerRole: "Architecte HMONP",
        preparedAt: "2026-05-23T10:00:00.000Z",
        message: "Validation requise pour Ordre de service.",
        body: "Validation requise pour Ordre de service. Merci de confirmer la validation.",
      },
    );

    expect(normalized).toMatchObject({
      destination: "+262639000000",
      signatureProfileLabel: "Visa chantier",
      signerName: "Alice Martin",
      preparedAt: "2026-05-23T10:00:00.000Z",
    });
  });

  it("construit l'etat Supabase complet si le profil et la demande existent", () => {
    const profileRow: Tables<"signature_profiles"> = {
      id: "signature_profile_supabase_001",
      organization_id: "org_001",
      label: "Visa chantier",
      signer_name: "Alice Martin",
      signer_role: "Architecte HMONP",
      signature_style: "typed",
      whatsapp_enabled: true,
      created_at: "2026-05-22T00:00:00.000Z",
      created_by: "user_001",
      updated_at: "2026-05-22T00:00:00.000Z",
    };
    const requestRow: Tables<"signature_requests"> = {
      id: "signature_request_supabase_001",
      document_id: "document_001",
      organization_id: "org_001",
      requested_by: "user_001",
      approver_id: null,
      signature_profile_id: "signature_profile_supabase_001",
      status: "pending_internal_validation",
      validation_notes: null,
      whatsapp_payload: {},
      created_at: "2026-05-22T00:00:00.000Z",
      updated_at: "2026-05-22T00:00:00.000Z",
    };
    const documentRow: Tables<"documents"> = {
      id: "document_001",
      template_id: "template_001",
      title: "Compte rendu chantier",
      subject: "Objet chantier",
      body_rendered: "Contenu",
      status: "generated",
      organization_id: "org_001",
      project_id: null,
      metadata: {},
      created_at: "2026-05-22T00:00:00.000Z",
      created_by: "user_001",
      updated_at: "2026-05-22T00:00:00.000Z",
    };
    const auditRow: Tables<"audit_logs"> = {
      id: "audit_001",
      organization_id: "org_001",
      entity_type: "signature_request",
      entity_id: "signature_request_supabase_001",
      action_type: "submitted",
      actor_user_id: "user_001",
      created_at: "2026-05-22T00:00:00.000Z",
      details: {},
    };

    const workflowData = buildSignatureWorkflowDataFromRows(
      profileRow,
      requestRow,
      [auditRow],
      documentRow,
    );

    expect(workflowData?.source).toBe("supabase");
    expect(workflowData?.auditEntries).toHaveLength(1);
    expect(workflowData?.request.documentTitle).toBe("Compte rendu chantier");
  });

  it("remplace les notes vides par le contexte WhatsApp si disponible", () => {
    const profileRow: Tables<"signature_profiles"> = {
      id: "signature_profile_supabase_002",
      organization_id: "org_001",
      label: "Visa chantier",
      signer_name: "Alice Martin",
      signer_role: "Architecte HMONP",
      signature_style: "typed",
      whatsapp_enabled: true,
      created_at: "2026-05-22T00:00:00.000Z",
      created_by: "user_001",
      updated_at: "2026-05-22T00:00:00.000Z",
    };
    const requestRow: Tables<"signature_requests"> = {
      id: "signature_request_supabase_002",
      document_id: "document_002",
      organization_id: "org_001",
      requested_by: "user_001",
      approver_id: null,
      signature_profile_id: "signature_profile_supabase_002",
      status: "pending_internal_validation",
      validation_notes: "   ",
      whatsapp_payload: {
        message: "Validation a lancer avant envoi client.",
      },
      created_at: "2026-05-22T00:00:00.000Z",
      updated_at: "2026-05-22T00:00:00.000Z",
    };

    const workflowData = buildSignatureWorkflowDataFromRows(profileRow, requestRow, []);

    expect(workflowData?.request.validationNotes).toBe(
      "Validation a lancer avant envoi client.",
    );
  });

  it("remonte le payload WhatsApp persiste dans la demande UI", () => {
    const row: Tables<"signature_requests"> = {
      id: "signature_request_supabase_010",
      document_id: "document_010",
      organization_id: "org_001",
      requested_by: "user_001",
      approver_id: null,
      signature_profile_id: "signature_profile_supabase_010",
      status: "pending_signature",
      validation_notes: "Pret pour envoi WhatsApp",
      whatsapp_payload: {
        channel: "whatsapp",
        destination: "+262639000001",
        destinationStatus: "pending_configuration",
        template: "signature_validation_v1",
        requestId: "signature_request_supabase_010",
        organizationId: "org_001",
        documentId: "document_010",
        preparedAt: "2026-05-23T11:15:00.000Z",
        message: "Validation requise pour DGD chantier.",
        body: "Validation requise pour DGD chantier. Merci de confirmer la validation.",
      },
      created_at: "2026-05-22T00:00:00.000Z",
      updated_at: "2026-05-23T11:15:00.000Z",
    };

    expect(mapSignatureRequestRow(row).whatsappPayload).toMatchObject({
      destination: "+262639000001",
      preparedAt: "2026-05-23T11:15:00.000Z",
    });
  });

  it("retombe sur la demo avec un message explicite", () => {
    const workflowData = buildDemoSignatureWorkflowData("Base indisponible.");

    expect(workflowData.source).toBe("demo");
    expect(workflowData.sourceMessage).toBe("Base indisponible.");
  });
});
