import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import {
  demoDocumentTemplates,
  demoDocumentVariables,
  demoGeneratedDocuments,
} from "@/modules/documents/services/demo-documents";
import { renderTemplate } from "@/modules/documents/services/template-renderer";
import type {
  DocumentTemplate,
  DocumentVariableMap,
  DocumentVariableSource,
  GeneratedDocument,
} from "@/modules/documents/types/document";
import type { Json, SupabaseDatabase, Tables } from "@/types/supabase";

type DocumentTemplateRow = Tables<"document_templates">;
type DocumentRow = Tables<"documents">;

export type DocumentPreviewData = {
  template: DocumentTemplate;
  document: GeneratedDocument;
  variables: DocumentVariableMap;
  variableSource: DocumentVariableSource;
  source: "supabase" | "demo";
  sourceMessage: string;
};

export function mapTemplateRowToDocumentTemplate(row: DocumentTemplateRow): DocumentTemplate {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    subject: normalizeLabel(row.subject, ""),
    bodyTemplate: normalizeLabel(row.body_template, ""),
    letterheadName: normalizeLabel(row.letterhead_name, "Entete non configuree"),
    logoLabel: normalizeLabel(row.logo_url, "Logo non configure"),
    stampLabel: normalizeLabel(row.stamp_label, "Tampon non configure"),
    signatureLabel: normalizeLabel(row.signature_label, "Signature non configuree"),
  };
}

export function mapDocumentRowToGeneratedDocument(row: DocumentRow): GeneratedDocument {
  return {
    id: row.id,
    templateId: row.template_id ?? "template_inconnu",
    organizationId: row.organization_id,
    projectId: row.project_id ?? undefined,
    title: normalizeLabel(row.title, "Document sans titre"),
    subject: normalizeLabel(row.subject, "Sans objet"),
    bodyRendered: normalizeLabel(row.body_rendered, ""),
    status: row.status,
  };
}

export function extractDocumentVariables(metadata: Json): DocumentVariableMap | null {
  const rootObject = asJsonObject(metadata);

  if (!rootObject) {
    return null;
  }

  const candidateKeys = ["variables", "templateVariables", "mergeFields"] as const;

  for (const key of candidateKeys) {
    const candidate = asJsonObject(rootObject[key]);

    if (candidate) {
      const mappedVariables = mapJsonRecordToVariables(candidate);

      if (Object.keys(mappedVariables).length > 0) {
        return mappedVariables;
      }
    }
  }

  const mappedRootVariables = mapJsonRecordToVariables(rootObject);
  return Object.keys(mappedRootVariables).length > 0 ? mappedRootVariables : null;
}

export function buildDocumentPreviewDataFromRows(
  templateRow: DocumentTemplateRow | null,
  documentRow: DocumentRow | null,
): DocumentPreviewData | null {
  if (!templateRow && !documentRow) {
    return null;
  }

  const template =
    templateRow ?
      mapTemplateRowToDocumentTemplate(templateRow)
    : demoDocumentTemplates[0]!;
  const mappedDocument = documentRow ? mapDocumentRowToGeneratedDocument(documentRow) : null;
  const supabaseVariables =
    documentRow ? extractDocumentVariables(documentRow.metadata) : null;
  const variables = supabaseVariables ?? demoDocumentVariables;
  const variableSource: DocumentVariableSource =
    supabaseVariables ? "supabase_metadata" : "demo";

  const document =
    mappedDocument ?? renderTemplate(template, variables);

  const sourceMessage = buildDocumentSourceMessage({
    hasSupabaseTemplate: Boolean(templateRow),
    hasSupabaseDocument: Boolean(documentRow),
    hasSupabaseVariables: Boolean(supabaseVariables),
    usesDemoTemplate: !templateRow,
  });

  return {
    template,
    document,
    variables,
    variableSource,
    source: "supabase",
    sourceMessage,
  };
}

export function buildDemoDocumentPreviewData(reason: string): DocumentPreviewData {
  return {
    template: demoDocumentTemplates[0]!,
    document: {
      ...demoGeneratedDocuments[0]!,
      organizationId: demoDocumentTemplates[0]!.organizationId,
    },
    variables: demoDocumentVariables,
    variableSource: "demo",
    source: "demo",
    sourceMessage: reason,
  };
}

export async function getDocumentPreviewData(): Promise<DocumentPreviewData> {
  const supabase = await createClient();

  if (!supabase) {
    return buildDemoDocumentPreviewData(
      "Configuration Supabase absente. Affichage des donnees de demonstration.",
    );
  }

  try {
    const { data: documentRows, error: documentError } = await supabase
      .from("documents")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (documentError) {
      return buildDemoDocumentPreviewData(
        "Supabase a repondu avec une erreur sur les documents. Repli automatique sur les donnees de demonstration.",
      );
    }

    const latestDocument = documentRows?.[0] ?? null;
    const templateRow = await resolveTemplateRow(supabase, latestDocument);

    const previewData = buildDocumentPreviewDataFromRows(templateRow, latestDocument);

    if (previewData) {
      return previewData;
    }

    const { data: latestTemplateRows, error: templateError } = await supabase
      .from("document_templates")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (templateError) {
      return buildDemoDocumentPreviewData(
        "Supabase a repondu avec une erreur sur les templates. Repli automatique sur les donnees de demonstration.",
      );
    }

    const templateOnlyPreview = buildDocumentPreviewDataFromRows(
      latestTemplateRows?.[0] ?? null,
      null,
    );

    if (templateOnlyPreview) {
      return templateOnlyPreview;
    }

    return buildDemoDocumentPreviewData(
      "Base disponible mais vide pour le module documentaire. Repli sur les donnees de demonstration.",
    );
  } catch {
    return buildDemoDocumentPreviewData(
      "Base indisponible pour le module documentaire. Repli sur les donnees de demonstration.",
    );
  }
}

async function resolveTemplateRow(
  supabase: SupabaseClient<SupabaseDatabase>,
  documentRow: DocumentRow | null,
): Promise<DocumentTemplateRow | null> {
  if (documentRow?.template_id) {
    const { data, error } = await supabase
      .from("document_templates")
      .select("*")
      .eq("id", documentRow.template_id)
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  }

  if (documentRow) {
    const { data, error } = await supabase
      .from("document_templates")
      .select("*")
      .eq("organization_id", documentRow.organization_id)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (!error && data?.[0]) {
      return data[0];
    }
  }

  const { data, error } = await supabase
    .from("document_templates")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    return null;
  }

  return data?.[0] ?? null;
}

function buildDocumentSourceMessage({
  hasSupabaseTemplate,
  hasSupabaseDocument,
  hasSupabaseVariables,
  usesDemoTemplate,
}: {
  hasSupabaseTemplate: boolean;
  hasSupabaseDocument: boolean;
  hasSupabaseVariables: boolean;
  usesDemoTemplate: boolean;
}): string {
  if (hasSupabaseDocument && hasSupabaseTemplate && hasSupabaseVariables) {
    return "Document, template et variables charges depuis Supabase.";
  }

  if (hasSupabaseDocument && hasSupabaseTemplate) {
    return "Document et template charges depuis Supabase. Les variables d'aperçu restent en demonstration faute de metadonnees exploitables.";
  }

  if (hasSupabaseDocument && usesDemoTemplate) {
    return "Document charge depuis Supabase, mais son template associe est introuvable. Le gabarit visuel de demonstration est utilise pour conserver un apercu lisible.";
  }

  if (hasSupabaseTemplate) {
    return "Template charge depuis Supabase. Apercu genere avec les variables de demonstration.";
  }

  return "Apercu reconstruit a partir des donnees disponibles dans Supabase.";
}

function normalizeLabel(value: string | null, fallback: string): string {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

function asJsonObject(value: Json | undefined): Record<string, Json> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, Json>;
}

function mapJsonRecordToVariables(record: Record<string, Json>): DocumentVariableMap {
  return Object.entries(record).reduce<DocumentVariableMap>((variables, [key, value]) => {
    if (typeof value === "string") {
      const normalizedValue = value.trim();

      if (normalizedValue.length > 0) {
        variables[key] = normalizedValue;
      }
    } else if (typeof value === "number" || typeof value === "boolean") {
      variables[key] = String(value);
    }

    return variables;
  }, {});
}
