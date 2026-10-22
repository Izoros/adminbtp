import { createClient } from "@/lib/supabase/server";
import type { DirectoryCategory, DirectoryCompany, DirectoryContact, DirectorySource } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type DirectoryCategoryRow = Database["public"]["Tables"]["directory_categories"]["Row"];
type DirectorySourceRow = Database["public"]["Tables"]["directory_sources"]["Row"];

function mapCategory(row: DirectoryCategoryRow): DirectoryCategory {
  return { id: row.id, code: row.code, label: row.label, serviceCode: row.service_code };
}

function mapSource(row: DirectorySourceRow): DirectorySource {
  return {
    id: row.id,
    label: row.label,
    importedByUserId: row.imported_by_user_id,
    importedAt: row.imported_at,
    createdCount: row.created_count,
    skippedCount: row.skipped_count,
    errorCount: row.error_count,
  };
}

export async function getDirectoryCategories(): Promise<DirectoryCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("directory_categories").select("*").order("label");
  if (error) throw error;
  return (data ?? []).map(mapCategory);
}

/**
 * Colonnes de navigation uniquement — les privilèges de colonne en base interdisent toute autre
 * colonne pour un SELECT direct (voir database/migrations/0017). Ne jamais ajouter `select("*")`
 * ici : ça échouerait avec "permission denied for column".
 */
export async function getDirectoryCompaniesBrowse(
  categoryId?: string
): Promise<Pick<DirectoryCompany, "id" | "categoryId" | "name" | "tradeCodeId" | "city" | "postalCode">[]> {
  const supabase = await createClient();
  let query = supabase
    .from("directory_companies")
    .select("id, category_id, name, trade_code_id, city, postal_code")
    .order("name");
  if (categoryId) query = query.eq("category_id", categoryId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    tradeCodeId: row.trade_code_id ?? undefined,
    city: row.city ?? undefined,
    postalCode: row.postal_code ?? undefined,
  }));
}

export type DirectoryCompanyDetail = Pick<
  DirectoryCompany,
  "id" | "siret" | "address" | "postalCode" | "city" | "phone" | "email" | "website" | "notes"
>;

/**
 * Consomme (et vérifie) le quota mensuel côté base — voir get_directory_company_detail() dans
 * database/migrations/0017. Lève une erreur Postgres explicite si non autorisé ou quota atteint ;
 * l'appelant (page Server Component) doit l'attraper pour afficher un message clair.
 */
export async function getDirectoryCompanyDetail(
  organizationId: string,
  companyId: string
): Promise<DirectoryCompanyDetail> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("get_directory_company_detail", { p_organization_id: organizationId, p_company_id: companyId })
    .single();
  if (error) throw error;
  return {
    id: data.id,
    siret: data.siret ?? undefined,
    address: data.address ?? undefined,
    postalCode: data.postal_code ?? undefined,
    city: data.city ?? undefined,
    phone: data.phone ?? undefined,
    email: data.email ?? undefined,
    website: data.website ?? undefined,
    notes: data.notes ?? undefined,
  };
}

export async function getDirectoryCompanyContacts(
  organizationId: string,
  companyId: string
): Promise<DirectoryContact[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_directory_company_contacts", {
    p_organization_id: organizationId,
    p_company_id: companyId,
  });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    companyId,
    fullName: row.full_name,
    role: row.role ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    isPrimary: row.is_primary,
  }));
}

/** Réservé Super Administrateur — bypasse les privilèges de colonne restreints. */
export async function getDirectoryCompaniesAdmin(
  categoryId?: string,
  search?: string
): Promise<DirectoryCompany[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_directory_companies_admin", {
    p_category_id: categoryId,
    p_search: search,
  });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    siret: row.siret ?? undefined,
    tradeCodeId: row.trade_code_id ?? undefined,
    address: row.address ?? undefined,
    postalCode: row.postal_code ?? undefined,
    city: row.city ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    website: row.website ?? undefined,
    notes: row.notes ?? undefined,
    sourceId: row.source_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getDirectorySources(): Promise<DirectorySource[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("directory_sources")
    .select("*")
    .order("imported_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapSource);
}
