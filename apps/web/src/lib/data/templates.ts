import { createClient } from "@/lib/supabase/server";
import type { PremiumDocumentTemplate, TemplatePurchase } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type PremiumTemplateRow = Database["public"]["Tables"]["document_template_catalog"]["Row"];
type TemplatePurchaseRow = Database["public"]["Tables"]["template_purchases"]["Row"];

function mapPremiumTemplate(row: PremiumTemplateRow): PremiumDocumentTemplate {
  return {
    id: row.id,
    serviceCode: row.service_code,
    code: row.code,
    name: row.name,
    description: row.description ?? undefined,
    category: row.category,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPurchase(row: TemplatePurchaseRow): TemplatePurchase {
  return {
    id: row.id,
    organizationId: row.organization_id,
    templateCatalogId: row.template_catalog_id,
    versionId: row.version_id,
    purchasedByUserId: row.purchased_by_user_id,
    purchasedAt: row.purchased_at,
    sourceAccessRequestId: row.source_access_request_id ?? undefined,
    note: row.note ?? undefined,
  };
}

/**
 * Catalogue complet des modèles premium, actifs ou non (le client ne doit voir que les modèles
 * actifs à l'achat, voir filtrage dans la page — un modèle retiré reste listé ici pour l'admin et
 * pour résoudre les achats déjà faits, voir docs/ROADMAP.md Phase C).
 */
export async function getPremiumDocumentTemplates(): Promise<PremiumDocumentTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("document_template_catalog").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map(mapPremiumTemplate);
}

export async function getTemplatePurchasesForOrganization(organizationId: string): Promise<TemplatePurchase[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("template_purchases")
    .select("*")
    .eq("organization_id", organizationId);
  if (error) throw error;
  return (data ?? []).map(mapPurchase);
}

/** Vue Super Administrateur : tous les achats, toutes organisations confondues. */
export async function getAllTemplatePurchases(): Promise<TemplatePurchase[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("template_purchases")
    .select("*")
    .order("purchased_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapPurchase);
}
