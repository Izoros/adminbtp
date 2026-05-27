import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
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
  source: "supabase";
  sourceMessage: string;
  hasPersistedTemplate: boolean;
  hasPersistedDocument: boolean;
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
    : buildMissingTemplatePreview(documentRow);
  const mappedDocument = documentRow ? mapDocumentRowToGeneratedDocument(documentRow) : null;
  const supabaseVariables =
    documentRow ? extractDocumentVariables(documentRow.metadata) : null;
  const variables = supabaseVariables ?? {};
  const variableSource: DocumentVariableSource =
    supabaseVariables ? "supabase_metadata" : "supabase_placeholder";

  const document =
    mappedDocument ??
    buildSupabasePreviewDocument(template, {
      organizationId: template.organizationId,
      projectId: documentRow?.project_id ?? undefined,
      variables,
    });

  const sourceMessage = buildDocumentSourceMessage({
    hasSupabaseTemplate: Boolean(templateRow),
    hasSupabaseDocument: Boolean(documentRow),
    hasSupabaseVariables: Boolean(supabaseVariables),
    usesPlaceholderTemplate: !templateRow,
  });

  return {
    template,
    document,
    variables,
    variableSource,
    source: "supabase",
    sourceMessage,
    hasPersistedTemplate: Boolean(templateRow),
    hasPersistedDocument: Boolean(documentRow),
  };
}

export async function getDocumentPreviewData(): Promise<DocumentPreviewData> {
  const supabase = await createClient();

  if (!supabase) {
    return buildEmptySupabaseDocumentPreviewData(
      "Configuration Supabase absente. Le module documentaire ne peut pas charger de donnees.",
    );
  }

  try {
    const { data: documentRows, error: documentError } = await supabase
      .from("documents")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (documentError) {
      return buildEmptySupabaseDocumentPreviewData(
        "Supabase a repondu avec une erreur sur les documents.",
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
      return buildEmptySupabaseDocumentPreviewData(
        "Supabase a repondu avec une erreur sur les templates.",
      );
    }

    const templateOnlyPreview = buildDocumentPreviewDataFromRows(
      latestTemplateRows?.[0] ?? null,
      null,
    );

    if (templateOnlyPreview) {
      return templateOnlyPreview;
    }

    return buildEmptySupabaseDocumentPreviewData();
  } catch {
    return buildEmptySupabaseDocumentPreviewData(
      "Base indisponible pour le module documentaire.",
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
  usesPlaceholderTemplate,
}: {
  hasSupabaseTemplate: boolean;
  hasSupabaseDocument: boolean;
  hasSupabaseVariables: boolean;
  usesPlaceholderTemplate: boolean;
}): string {
  if (hasSupabaseDocument && hasSupabaseTemplate && hasSupabaseVariables) {
    return "Document, template et variables charges depuis Supabase.";
  }

  if (hasSupabaseDocument && hasSupabaseTemplate) {
    return "Document et template charges depuis Supabase. Les variables stockees ne sont pas exploitables, l'aperçu affiche donc le corps rendu tel qu'il existe en base.";
  }

  if (hasSupabaseDocument && usesPlaceholderTemplate) {
    return "Document charge depuis Supabase, mais son template associe est introuvable. Un gabarit neutre est reconstruit localement pour afficher l'apercu sans injecter de contenu factice.";
  }

  if (hasSupabaseTemplate) {
    return "Template charge depuis Supabase. Aucun document n'est encore stocke pour ce template, l'aperçu affiche donc des variables non renseignees.";
  }

  return "Supabase est accessible, mais aucun template ni document n'est encore disponible pour la base documentaire.";
}

function buildSupabasePreviewDocument(
  template: DocumentTemplate,
  options: {
    organizationId?: string;
    projectId?: string;
    variables: DocumentVariableMap;
  },
): GeneratedDocument {
  return {
    ...renderTemplate(template, options.variables),
    organizationId: options.organizationId,
    projectId: options.projectId,
  };
}

function buildMissingTemplatePreview(documentRow: DocumentRow | null): DocumentTemplate {
  return {
    id: documentRow?.template_id ?? "",
    organizationId: documentRow?.organization_id ?? "",
    code: documentRow?.template_id ?? "template_introuvable",
    name: "Template Supabase introuvable",
    subject: documentRow?.subject ?? "Document sans template associe",
    bodyTemplate:
      documentRow?.body_rendered ??
      "Le template de ce document n'est plus disponible dans Supabase.",
    letterheadName: "Template introuvable dans Supabase",
    logoLabel: "Logo non renseigne",
    stampLabel: "Tampon non renseigne",
    signatureLabel: "Signature non renseignee",
  };
}

export function buildEmptySupabaseDocumentPreviewData(
  reason?: string,
): DocumentPreviewData {
  const template: DocumentTemplate = {
    id: "",
    organizationId: "",
    code: "template_absent",
    name: "Aucun template disponible",
    subject: "Document en attente de configuration",
    bodyTemplate:
      "Ajoutez d'abord un template dans Supabase pour generer un premier document.",
    letterheadName: "Base documentaire vide",
    logoLabel: "Logo non renseigne",
    stampLabel: "Tampon non renseigne",
    signatureLabel: "Signature non renseignee",
  };
  const document: GeneratedDocument = {
    id: "",
    templateId: "",
    organizationId: "",
    title: "Aucun document disponible",
    subject: "Document en attente de configuration",
    bodyRendered:
      "La base Supabase est accessible, mais aucun template ni document n'est encore disponible pour ce module.",
    status: "draft",
  };

  return {
    template,
    document,
    variables: {},
    variableSource: "supabase_placeholder",
    source: "supabase",
    sourceMessage:
      reason ??
      "Supabase est accessible, mais aucun template ni document n'est encore disponible pour la base documentaire.",
    hasPersistedTemplate: false,
    hasPersistedDocument: false,
  };
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
