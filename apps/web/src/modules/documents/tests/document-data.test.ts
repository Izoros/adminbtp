import {
  buildDemoDocumentPreviewData,
  buildDocumentPreviewDataFromRows,
  extractDocumentVariables,
  mapDocumentRowToGeneratedDocument,
  mapTemplateRowToDocumentTemplate,
} from "@/modules/documents/services/document-data";
import type { Tables } from "@/types/supabase";

describe("alimentation documentaire", () => {
  it("mappe un template Supabase vers le modele UI", () => {
    const row: Tables<"document_templates"> = {
      id: "template_supabase_001",
      organization_id: "org_001",
      code: "cr-chantier",
      name: "Compte rendu chantier",
      subject: "Objet chantier",
      body_template: "Bonjour {{recipient_name}}",
      letterhead_name: "Entete test",
      logo_url: "https://example.test/logo.png",
      stamp_label: "Tampon test",
      signature_label: "Signature test",
      created_at: "2026-05-22T00:00:00.000Z",
      created_by: "user_001",
      updated_at: "2026-05-22T00:00:00.000Z",
    };

    expect(mapTemplateRowToDocumentTemplate(row)).toMatchObject({
      id: "template_supabase_001",
      organizationId: "org_001",
      letterheadName: "Entete test",
      logoLabel: "https://example.test/logo.png",
    });
  });

  it("mappe un document Supabase vers le modele UI", () => {
    const row: Tables<"documents"> = {
      id: "document_supabase_001",
      template_id: "template_supabase_001",
      title: "CR chantier",
      subject: "Objet chantier",
      body_rendered: "Contenu genere",
      status: "generated",
      organization_id: "org_001",
      project_id: null,
      metadata: {},
      created_at: "2026-05-22T00:00:00.000Z",
      created_by: "user_001",
      updated_at: "2026-05-22T00:00:00.000Z",
    };

    expect(mapDocumentRowToGeneratedDocument(row)).toMatchObject({
      id: "document_supabase_001",
      templateId: "template_supabase_001",
      organizationId: "org_001",
      bodyRendered: "Contenu genere",
    });
  });

  it("extrait les variables exploitables depuis les metadonnees du document", () => {
    const row: Tables<"documents"> = {
      id: "document_supabase_002",
      template_id: "template_supabase_001",
      title: "CR chantier",
      subject: "Objet chantier",
      body_rendered: "Contenu genere",
      status: "generated",
      organization_id: "org_001",
      project_id: "project_001",
      metadata: {
        variables: {
          recipient_name: "MOE test",
          project_name: "College Majicavo",
          sequence: 12,
        },
      },
      created_at: "2026-05-22T00:00:00.000Z",
      created_by: "user_001",
      updated_at: "2026-05-22T00:00:00.000Z",
    };

    expect(extractDocumentVariables(row.metadata)).toEqual({
      recipient_name: "MOE test",
      project_name: "College Majicavo",
      sequence: "12",
    });
  });

  it("utilise le template Supabase et le fallback de rendu si aucun document n'existe", () => {
    const templateRow: Tables<"document_templates"> = {
      id: "template_supabase_002",
      organization_id: "org_001",
      code: "os",
      name: "Ordre de service",
      subject: "OS - {{project_name}}",
      body_template: "Bonjour {{recipient_name}}",
      letterhead_name: "Entete chantier",
      logo_url: null,
      stamp_label: null,
      signature_label: null,
      created_at: "2026-05-22T00:00:00.000Z",
      created_by: "user_001",
      updated_at: "2026-05-22T00:00:00.000Z",
    };

    const previewData = buildDocumentPreviewDataFromRows(templateRow, null);

    expect(previewData?.source).toBe("supabase");
    expect(previewData?.document.subject).toContain("[project_name]");
    expect(previewData?.sourceMessage).toContain("Template charge depuis Supabase");
    expect(previewData?.variableSource).toBe("supabase_placeholder");
    expect(previewData?.hasPersistedTemplate).toBe(true);
    expect(previewData?.hasPersistedDocument).toBe(false);
  });

  it("utilise les variables Supabase du document quand elles existent", () => {
    const templateRow: Tables<"document_templates"> = {
      id: "template_supabase_003",
      organization_id: "org_001",
      code: "cr",
      name: "Compte rendu",
      subject: "CR - {{project_name}}",
      body_template: "Bonjour {{recipient_name}}",
      letterhead_name: "Entete chantier",
      logo_url: null,
      stamp_label: null,
      signature_label: null,
      created_at: "2026-05-22T00:00:00.000Z",
      created_by: "user_001",
      updated_at: "2026-05-22T00:00:00.000Z",
    };
    const documentRow: Tables<"documents"> = {
      id: "document_supabase_003",
      template_id: "template_supabase_003",
      title: "CR chantier",
      subject: "Objet chantier",
      body_rendered: "Contenu genere",
      status: "validated",
      organization_id: "org_001",
      project_id: "project_001",
      metadata: {
        variables: {
          recipient_name: "MOA test",
          project_name: "Lycee de Mamoudzou",
        },
      },
      created_at: "2026-05-22T00:00:00.000Z",
      created_by: "user_001",
      updated_at: "2026-05-22T00:00:00.000Z",
    };

    const previewData = buildDocumentPreviewDataFromRows(templateRow, documentRow);

    expect(previewData?.variableSource).toBe("supabase_metadata");
    expect(previewData?.variables.project_name).toBe("Lycee de Mamoudzou");
    expect(previewData?.sourceMessage).toContain("variables charges depuis Supabase");
    expect(previewData?.hasPersistedTemplate).toBe(true);
    expect(previewData?.hasPersistedDocument).toBe(true);
  });

  it("garde un etat Supabase honnete si le document existe sans template associe", () => {
    const documentRow: Tables<"documents"> = {
      id: "document_supabase_004",
      template_id: "template_supprime_001",
      title: "CR chantier",
      subject: "Objet chantier",
      body_rendered: "Contenu conserve en base",
      status: "generated",
      organization_id: "org_001",
      project_id: "project_001",
      metadata: {},
      created_at: "2026-05-22T00:00:00.000Z",
      created_by: "user_001",
      updated_at: "2026-05-22T00:00:00.000Z",
    };

    const previewData = buildDocumentPreviewDataFromRows(null, documentRow);

    expect(previewData?.source).toBe("supabase");
    expect(previewData?.template.name).toBe("Template Supabase introuvable");
    expect(previewData?.document.bodyRendered).toBe("Contenu conserve en base");
    expect(previewData?.variableSource).toBe("supabase_placeholder");
    expect(previewData?.sourceMessage).toContain("template associe est introuvable");
    expect(previewData?.hasPersistedTemplate).toBe(false);
    expect(previewData?.hasPersistedDocument).toBe(true);
  });

  it("retombe sur la demo avec un message explicite", () => {
    const previewData = buildDemoDocumentPreviewData("Base indisponible.");

    expect(previewData.source).toBe("demo");
    expect(previewData.sourceMessage).toBe("Base indisponible.");
    expect(previewData.variableSource).toBe("demo");
    expect(previewData.hasPersistedTemplate).toBe(false);
    expect(previewData.hasPersistedDocument).toBe(false);
  });
});
