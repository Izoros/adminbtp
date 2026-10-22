import { createClient } from "@/lib/supabase/server";
import type {
  AccessRequest,
  AccessRequestStatus,
  EntitlementGrant,
  OrganizationEntitlement,
  ServiceCatalogItem,
  ServiceCategory,
  ServicePrice,
} from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type ServiceCategoryRow = Database["public"]["Tables"]["service_categories"]["Row"];
type ServiceCatalogRow = Database["public"]["Tables"]["service_catalog"]["Row"];
type ServicePriceRow = Database["public"]["Tables"]["service_prices"]["Row"];
type AccessRequestRow = Database["public"]["Tables"]["access_requests"]["Row"];
type OrganizationEntitlementRow = Database["public"]["Tables"]["organization_entitlements"]["Row"];
type EntitlementGrantRow = Database["public"]["Tables"]["entitlement_grants"]["Row"];

function mapCategory(row: ServiceCategoryRow): ServiceCategory {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    description: row.description ?? undefined,
    sortOrder: row.sort_order,
  };
}

function mapCatalogItem(row: ServiceCatalogRow): ServiceCatalogItem {
  return {
    id: row.id,
    categoryId: row.category_id,
    code: row.code,
    name: row.name,
    description: row.description ?? undefined,
    billingModel: row.billing_model,
    requiresAdminApproval: row.requires_admin_approval,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPrice(row: ServicePriceRow): ServicePrice {
  return {
    id: row.id,
    serviceId: row.service_id,
    amountCents: row.amount_cents,
    currency: row.currency,
    billingPeriod: row.billing_period,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to ?? undefined,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
  };
}

function mapAccessRequest(row: AccessRequestRow): AccessRequest {
  return {
    id: row.id,
    organizationId: row.organization_id,
    serviceId: row.service_id,
    requestedByUserId: row.requested_by_user_id,
    status: row.status,
    message: row.message ?? undefined,
    adminDecisionByUserId: row.admin_decision_by_user_id ?? undefined,
    adminDecisionAt: row.admin_decision_at ?? undefined,
    adminNote: row.admin_note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEntitlement(row: OrganizationEntitlementRow): OrganizationEntitlement {
  return {
    id: row.id,
    organizationId: row.organization_id,
    serviceId: row.service_id,
    status: row.status,
    priceId: row.price_id ?? undefined,
    grantedByUserId: row.granted_by_user_id,
    grantedAt: row.granted_at,
    expiresAt: row.expires_at ?? undefined,
    revokedAt: row.revoked_at ?? undefined,
    revokedByUserId: row.revoked_by_user_id ?? undefined,
    revokeReason: row.revoke_reason ?? undefined,
    sourceAccessRequestId: row.source_access_request_id ?? undefined,
    notes: row.notes ?? undefined,
    updatedAt: row.updated_at,
  };
}

function mapGrant(row: EntitlementGrantRow): EntitlementGrant {
  return {
    id: row.id,
    organizationId: row.organization_id,
    serviceId: row.service_id,
    action: row.action,
    performedByUserId: row.performed_by_user_id,
    performedAt: row.performed_at,
    previousStatus: row.previous_status ?? undefined,
    newStatus: row.new_status,
    expiresAt: row.expires_at ?? undefined,
    note: row.note ?? undefined,
  };
}

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("service_categories").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []).map(mapCategory);
}

/** Catalogue complet avec le tarif actuellement en vigueur (effective_to is null) pour chaque service. */
export async function getServiceCatalogWithPrices(): Promise<
  (ServiceCatalogItem & { currentPrice: ServicePrice | null })[]
> {
  const supabase = await createClient();
  const [{ data: catalog, error: catalogError }, { data: prices, error: pricesError }] = await Promise.all([
    supabase.from("service_catalog").select("*").order("name"),
    supabase.from("service_prices").select("*").is("effective_to", null),
  ]);
  if (catalogError) throw catalogError;
  if (pricesError) throw pricesError;

  const priceByService = new Map((prices ?? []).map((p) => [p.service_id, mapPrice(p)]));
  return (catalog ?? []).map((row) => ({
    ...mapCatalogItem(row),
    currentPrice: priceByService.get(row.id) ?? null,
  }));
}

export async function getOrganizationEntitlements(organizationId: string): Promise<OrganizationEntitlement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_entitlements")
    .select("*")
    .eq("organization_id", organizationId);
  if (error) throw error;
  return (data ?? []).map(mapEntitlement);
}

export async function getAccessRequestsForOrganization(
  organizationId: string
): Promise<AccessRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("access_requests")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapAccessRequest);
}

/** Vue Super Administrateur : toutes les demandes, optionnellement filtrées par statut. */
export async function getAllAccessRequests(status?: AccessRequestStatus): Promise<AccessRequest[]> {
  const supabase = await createClient();
  let query = supabase.from("access_requests").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapAccessRequest);
}

/** Vue Super Administrateur : tous les entitlements, toutes organisations confondues. */
export async function getAllOrganizationEntitlements(): Promise<OrganizationEntitlement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_entitlements")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapEntitlement);
}

export async function getEntitlementGrantsForOrganization(organizationId: string): Promise<EntitlementGrant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entitlement_grants")
    .select("*")
    .eq("organization_id", organizationId)
    .order("performed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapGrant);
}
