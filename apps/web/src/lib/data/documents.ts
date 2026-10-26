import { createClient } from "@/lib/supabase/server";
import type { Document, DocumentTemplate } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
type DocumentTemplateRow = Database["public"]["Tables"]["document_templates"]["Row"];

function mapDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    organizationId: row.organization_id,
    siteId: row.site_id ?? undefined,
    category: row.category,
    title: row.title,
    status: row.status,
    fileUrl: row.file_url,
    version: row.version,
    templateId: row.template_id ?? undefined,
    concernsOrganizationId: row.concerns_organization_id ?? undefined,
    actCode: row.act_code ?? undefined,
    lotId: row.lot_id ?? undefined,
    sourceLogEntryId: row.source_log_entry_id ?? undefined,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDocumentTemplate(row: DocumentTemplateRow): DocumentTemplate {
  return {
    id: row.id,
    organizationId: row.organization_id,
    category: row.category,
    name: row.name,
    fileUrl: row.file_url,
    variables: row.variables ?? [],
    requiresExpertReview: row.requires_expert_review,
    version: row.version,
    audienceLegalKind: row.audience_legal_kind ?? undefined,
    audienceTradeCode: row.audience_trade_code ?? undefined,
    createdAt: row.created_at,
  };
}

export async function getDocuments(): Promise<Document[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapDocument);
}

export async function getDocument(id: string): Promise<Document | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapDocument(data) : null;
}

export async function getDocumentsBySite(siteId: string): Promise<Document[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapDocument);
}

/**
 * Préfiltre optionnel par profil d'organisation (forme juridique, corps d'état) — un modèle sans
 * tag reste visible à tous. Ne crée aucun droit ; si un modèle devient un service premium, c'est
 * has_entitlement() qui gouverne l'accès, pas ce filtre.
 */
export async function getDocumentTemplate(id: string): Promise<DocumentTemplate | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("document_templates").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapDocumentTemplate(data) : null;
}

export async function getDocumentTemplates(
  organizationId: string,
  audience?: { legalKind?: string; tradeCodes?: string[] }
): Promise<DocumentTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_templates")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name");
  if (error) throw error;
  const templates = (data ?? []).map(mapDocumentTemplate);
  if (!audience) return templates;
  return templates.filter((t) => {
    const legalKindOk = !t.audienceLegalKind || t.audienceLegalKind === audience.legalKind;
    const tradeOk = !t.audienceTradeCode || (audience.tradeCodes ?? []).includes(t.audienceTradeCode);
    return legalKindOk && tradeOk;
  });
}
