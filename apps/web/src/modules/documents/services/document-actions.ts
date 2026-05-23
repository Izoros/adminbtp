"use server";

import { revalidatePath } from "next/cache";

import {
  assertOrganizationAccess,
  assertProjectAccess,
  loadServerOrganizationScope,
  loadServerProjectScope,
  ScopeGuardError,
} from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { buildDocumentVariablesFromFormData } from "@/modules/documents/services/document-action-helpers";
import { renderTemplate } from "@/modules/documents/services/template-renderer";
import type { DocumentStatus, DocumentTemplate } from "@/modules/documents/types/document";
import type { Tables } from "@/types/supabase";

type DocumentTemplateRow = Tables<"document_templates">;

const fallbackActorId = "user_adminbtp_system";

export type DocumentMutationState = {
  status: "idle" | "success" | "error";
  mode: "demo" | "supabase";
  message: string;
};

export const initialDocumentMutationState: DocumentMutationState = {
  status: "idle",
  mode: "demo",
  message: "",
};

export async function createDocumentAction(
  _previousState: DocumentMutationState,
  formData: FormData,
): Promise<DocumentMutationState> {
  const templateId = readRequiredField(formData, "templateId");
  const organizationId = readRequiredField(formData, "organizationId");
  const projectId = readOptionalField(formData, "projectId");
  const requestedBy = readOptionalField(formData, "requestedBy") ?? fallbackActorId;
  const variables = buildDocumentVariablesFromFormData(formData);

  if (!templateId || !organizationId) {
    return {
      status: "error",
      mode: "demo",
      message: "Impossible de creer le document sans template ni organisation.",
    };
  }

  const supabase = await createClient();

  if (!supabase) {
    return {
      status: "success",
      mode: "demo",
      message: "Supabase indisponible. La creation reste simulee en mode demonstration.",
    };
  }

  const organizationScope = await loadServerOrganizationScope(supabase);

  if (!organizationScope) {
    return {
      status: "error",
      mode: "supabase",
      message: "Le scope organisation de la session est introuvable. Reconnectez-vous avant de creer un document.",
    };
  }

  try {
    assertOrganizationAccess(organizationScope, organizationId);

    if (projectId) {
      const projectScope = await loadServerProjectScope(
        supabase,
        organizationScope.accessibleOrganizationIds,
      );

      if (!projectScope) {
        return {
          status: "error",
          mode: "supabase",
          message: "Le scope projet de la session est introuvable. Reessayez apres rechargement.",
        };
      }

      assertProjectAccess(projectScope, {
        projectId,
        organizationId,
      });
    }
  } catch (error) {
    if (error instanceof ScopeGuardError) {
      return {
        status: "error",
        mode: "supabase",
        message: error.message,
      };
    }

    throw error;
  }

  const { data: templateRow, error: templateError } = await supabase
    .from("document_templates")
    .select("*")
    .eq("id", templateId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (templateError || !templateRow) {
    return {
      status: "error",
      mode: "demo",
      message: "Le template cible est introuvable dans Supabase. Aucun document n'a ete cree.",
    };
  }

  const template = mapTemplateRowToDocumentTemplate(templateRow);
  const generatedDocument = renderTemplate(template, variables);

  const { error: insertError } = await supabase.from("documents").insert({
    organization_id: organizationId,
    project_id: projectId ?? null,
    template_id: templateId,
    created_by: requestedBy,
    title: generatedDocument.title,
    subject: generatedDocument.subject,
    body_rendered: generatedDocument.bodyRendered,
    status: "generated",
    metadata: {
      variables,
    },
  });

  if (insertError) {
    return {
      status: "error",
      mode: "supabase",
      message: "Supabase a refuse la creation du document. Verifiez les droits et la structure de base.",
    };
  }

  revalidatePath("/documents");
  revalidatePath("/signatures");

  return {
    status: "success",
    mode: "supabase",
    message: "Document cree dans Supabase et apercu revalide.",
  };
}

export async function updateDocumentStatusAction(
  _previousState: DocumentMutationState,
  formData: FormData,
): Promise<DocumentMutationState> {
  const documentId = readRequiredField(formData, "documentId");
  const organizationId = readRequiredField(formData, "organizationId");
  const nextStatus = readRequiredField(formData, "nextStatus") as DocumentStatus | null;

  if (!documentId || !organizationId || !nextStatus) {
    return {
      status: "error",
      mode: "demo",
      message: "Impossible de mettre a jour le statut sans identifiants complets.",
    };
  }

  const allowedStatuses: DocumentStatus[] = ["draft", "generated", "validated", "archived"];

  if (!allowedStatuses.includes(nextStatus)) {
    return {
      status: "error",
      mode: "demo",
      message: "Le statut demande n'est pas autorise pour le module documentaire.",
    };
  }

  const supabase = await createClient();

  if (!supabase) {
    return {
      status: "success",
      mode: "demo",
      message: `Supabase indisponible. Le passage au statut ${nextStatus} reste simule.`,
    };
  }

  const organizationScope = await loadServerOrganizationScope(supabase);

  if (!organizationScope) {
    return {
      status: "error",
      mode: "supabase",
      message: "Le scope organisation de la session est introuvable. Reconnectez-vous avant de mettre a jour le document.",
    };
  }

  try {
    assertOrganizationAccess(organizationScope, organizationId);
  } catch (error) {
    if (error instanceof ScopeGuardError) {
      return {
        status: "error",
        mode: "supabase",
        message: error.message,
      };
    }

    throw error;
  }

  const { error } = await supabase
    .from("documents")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .eq("organization_id", organizationId);

  if (error) {
    return {
      status: "error",
      mode: "supabase",
      message: "La mise a jour du statut document a echoue dans Supabase.",
    };
  }

  revalidatePath("/documents");
  revalidatePath("/signatures");

  return {
    status: "success",
    mode: "supabase",
    message: `Statut document mis a jour vers ${nextStatus}.`,
  };
}

export async function regenerateDocumentAction(
  _previousState: DocumentMutationState,
  formData: FormData,
): Promise<DocumentMutationState> {
  const documentId = readRequiredField(formData, "documentId");
  const templateId = readRequiredField(formData, "templateId");
  const organizationId = readRequiredField(formData, "organizationId");
  const projectId = readOptionalField(formData, "projectId");
  const variables = buildDocumentVariablesFromFormData(formData);

  if (!documentId || !templateId || !organizationId) {
    return {
      status: "error",
      mode: "demo",
      message: "Impossible de regenerer le document sans identifiants complets.",
    };
  }

  const supabase = await createClient();

  if (!supabase) {
    return {
      status: "success",
      mode: "demo",
      message: "Supabase indisponible. La regeneration reste simulee en mode demonstration.",
    };
  }

  const organizationScope = await loadServerOrganizationScope(supabase);

  if (!organizationScope) {
    return {
      status: "error",
      mode: "supabase",
      message: "Le scope organisation de la session est introuvable. Reconnectez-vous avant de regenerer le document.",
    };
  }

  try {
    assertOrganizationAccess(organizationScope, organizationId);

    if (projectId) {
      const projectScope = await loadServerProjectScope(
        supabase,
        organizationScope.accessibleOrganizationIds,
      );

      if (!projectScope) {
        return {
          status: "error",
          mode: "supabase",
          message: "Le scope projet de la session est introuvable. Reessayez apres rechargement.",
        };
      }

      assertProjectAccess(projectScope, {
        projectId,
        organizationId,
      });
    }
  } catch (error) {
    if (error instanceof ScopeGuardError) {
      return {
        status: "error",
        mode: "supabase",
        message: error.message,
      };
    }

    throw error;
  }

  const { data: templateRow, error: templateError } = await supabase
    .from("document_templates")
    .select("*")
    .eq("id", templateId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (templateError || !templateRow) {
    return {
      status: "error",
      mode: "supabase",
      message: "Le template cible est introuvable dans Supabase. Le document n'a pas ete regenere.",
    };
  }

  const template = mapTemplateRowToDocumentTemplate(templateRow);
  const regeneratedDocument = renderTemplate(template, variables);

  const { error: updateError } = await supabase
    .from("documents")
    .update({
      title: regeneratedDocument.title,
      subject: regeneratedDocument.subject,
      body_rendered: regeneratedDocument.bodyRendered,
      metadata: {
        variables,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .eq("organization_id", organizationId);

  if (updateError) {
    return {
      status: "error",
      mode: "supabase",
      message: "Supabase a refuse la regeneration du document. Verifiez les droits et l'existence du document cible.",
    };
  }

  revalidatePath("/documents");
  revalidatePath("/signatures");
  revalidatePath("/client-space");

  return {
    status: "success",
    mode: "supabase",
    message: "Document regenere dans Supabase et apercu revalide.",
  };
}

function mapTemplateRowToDocumentTemplate(row: DocumentTemplateRow): DocumentTemplate {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    subject: row.subject ?? "",
    bodyTemplate: row.body_template,
    letterheadName: row.letterhead_name ?? "Entete non configuree",
    logoLabel: row.logo_url ?? "Logo non configure",
    stampLabel: row.stamp_label ?? "Tampon non configure",
    signatureLabel: row.signature_label ?? "Signature non configuree",
  };
}

function readRequiredField(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readOptionalField(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
