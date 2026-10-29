"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@adminbtp/integrations";
import { getDocumentTemplate } from "@/lib/data/documents";
import { renderGeneratedDocumentPdf } from "@/lib/pdf/generated-document";
import type { DocumentCategory } from "@adminbtp/types";

export async function createDocument(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const siteId = String(formData.get("siteId") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() as DocumentCategory;
  const title = String(formData.get("title") ?? "").trim();

  if (!organizationId || !category || !title) {
    throw new Error("Organisation, catégorie et titre sont obligatoires.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  // Règle produit non négociable : un PPSPS naît toujours en PREEDITION — garantie désormais
  // technique (trigger enforce_ppsps_preedition(), migration 0035), ce statut n'est qu'un défaut
  // cohérent côté UI. Tout autre document créé manuellement démarre en BROUILLON : la création ne
  // doit jamais sauter les étapes du circuit de contrôle.
  const status = category === "PPSPS" ? "PREEDITION" : "BROUILLON";

  // Document vierge, sans contenu ni fichier réel — voir generateDocumentFromTemplate() pour la
  // génération IA avec stockage réel (Phase 3, Supabase Storage).
  const fileUrl = `demo://documents/${randomUUID()}.pdf`;

  const { error } = await supabase.from("documents").insert({
    organization_id: organizationId,
    site_id: siteId || null,
    category,
    title,
    status,
    file_url: fileUrl,
    created_by_user_id: user.id,
  });

  if (error) throw error;

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  redirect("/documents");
}

/**
 * Génère le contenu d'un document via IAIProvider (DeepSeek si DEEPSEEK_API_KEY est définie,
 * DemoAIProvider sinon) à partir d'un modèle et de ses variables, le met en page en PDF et le
 * stocke réellement (Supabase Storage, bucket "documents", chemin {organizationId}/{documentId}.pdf
 * — RLS alignée sur can_access_organization(), migration 0035). Le statut initial reste décidé
 * par la base, jamais ici : enforce_ppsps_preedition() force PREEDITION pour tout PPSPS, quel que
 * soit le statut inséré.
 */
export async function generateDocumentFromTemplate(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const siteId = String(formData.get("siteId") ?? "").trim();
  const templateId = String(formData.get("templateId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!organizationId || !templateId || !title) {
    throw new Error("Organisation, modèle et titre sont obligatoires.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const template = await getDocumentTemplate(templateId);
  if (!template || template.organizationId !== organizationId) {
    throw new Error("Modèle introuvable pour cette organisation.");
  }

  const variables: Record<string, string> = {};
  for (const name of template.variables) {
    variables[name] = String(formData.get(`variable:${name}`) ?? "").trim();
  }

  const ai = getAIProvider();
  const body = await ai.generateDocumentContent({
    category: template.category,
    templateName: template.name,
    title,
    variables,
  });

  const generatedAt = new Date();
  const pdfBytes = await renderGeneratedDocumentPdf({ title, body, generatedAt });

  const documentId = randomUUID();
  const storagePath = `${organizationId}/${documentId}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, pdfBytes, { contentType: "application/pdf" });
  if (uploadError) throw uploadError;

  // Statut non précisé pour PPSPS : enforce_ppsps_preedition() le force à PREEDITION en base ;
  // les autres catégories démarrent en BROUILLON, comme createDocument().
  const status = template.category === "PPSPS" ? "PREEDITION" : "BROUILLON";
  const { error: insertError } = await supabase.from("documents").insert({
    id: documentId,
    organization_id: organizationId,
    site_id: siteId || null,
    category: template.category,
    title,
    status,
    file_url: storagePath,
    template_id: templateId,
    created_by_user_id: user.id,
  });
  if (insertError) throw insertError;

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  redirect("/documents");
}

/**
 * Génère un document à partir d'un modèle premium acheté (bibliothèque de documents, Phase C du
 * module Marketplace — voir docs/MONETIZATION_AND_ENTITLEMENTS.md et docs/ROADMAP.md). Réutilise
 * exactement le même pipeline que generateDocumentFromTemplate() ci-dessus (IAIProvider + rendu
 * PDF pdf-lib + Supabase Storage), seule la provenance du modèle change.
 *
 * Double vérification, même principe que get_directory_company_detail() en Phase B : la policy
 * RLS SELECT sur template_versions (has_any_template_purchase()) est une première barrière, mais
 * cette Server Action revérifie explicitement l'achat en appelant get_purchased_template_version()
 * (SECURITY DEFINER) — un appel direct à l'API sans passer par ce RPC ne peut donc jamais générer
 * de document à partir d'un modèle non acheté par l'organisation.
 */
export async function generateDocumentFromPremiumTemplate(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const siteId = String(formData.get("siteId") ?? "").trim();
  const templateCatalogId = String(formData.get("templateCatalogId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!organizationId || !templateCatalogId || !title) {
    throw new Error("Organisation, modèle et titre sont obligatoires.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  // Vérification explicite de l'achat, indépendante de la RLS — voir get_purchased_template_version()
  // (database/migrations/0042_template_marketplace_phase_c_functions.sql). Lève une exception
  // Postgres 42501 si cette organisation n'a pas acheté ce modèle.
  const { data: versionRows, error: versionError } = await supabase.rpc("get_purchased_template_version", {
    p_organization_id: organizationId,
    p_template_catalog_id: templateCatalogId,
  });
  if (versionError) throw versionError;
  const version = versionRows?.[0];
  if (!version) {
    throw new Error("Ce modèle n'a pas été acheté par cette organisation.");
  }

  const variables: Record<string, string> = {};
  for (const name of version.variables) {
    variables[name] = String(formData.get(`variable:${name}`) ?? "").trim();
  }

  const ai = getAIProvider();
  const body = await ai.generateDocumentContent({
    category: version.category,
    templateName: version.name,
    title,
    variables,
  });

  const generatedAt = new Date();
  const pdfBytes = await renderGeneratedDocumentPdf({ title, body, generatedAt });

  const documentId = randomUUID();
  const storagePath = `${organizationId}/${documentId}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, pdfBytes, { contentType: "application/pdf" });
  if (uploadError) throw uploadError;

  // Statut non précisé pour PPSPS : enforce_ppsps_preedition() le force à PREEDITION en base.
  const status = version.category === "PPSPS" ? "PREEDITION" : "BROUILLON";
  const { error: insertError } = await supabase.from("documents").insert({
    id: documentId,
    organization_id: organizationId,
    site_id: siteId || null,
    category: version.category,
    title,
    status,
    file_url: storagePath,
    premium_template_version_id: version.version_id,
    created_by_user_id: user.id,
  });
  if (insertError) throw insertError;

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  redirect("/documents");
}

/** URL signée temporaire (10 min) pour télécharger un document réellement stocké — jamais de fichier "demo://". */
export async function getDocumentDownloadUrl(fileUrl: string): Promise<string | null> {
  if (fileUrl.startsWith("demo://")) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(fileUrl, 600);
  if (error) throw error;
  return data.signedUrl;
}
