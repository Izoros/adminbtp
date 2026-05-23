import { loadServerOrganizationScope } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { getDemoOdooMappingBoardData } from "@/modules/settings/services/demo-odoo";
import {
  findCustomerMappingForOrganization,
  getMappingsByType,
} from "@/modules/settings/services/odoo-mapping";
import type {
  OdooBindingType,
  OdooMapping,
  OdooMappingBoardData,
  OdooMappingQuery,
} from "@/modules/settings/types/odoo";
import type { Tables } from "@/types/supabase";

type OdooMappingRow = Tables<"odoo_mappings">;

export type OdooSupabaseReader = {
  listMappings: (query?: OdooMappingQuery) => Promise<OdooMappingRow[]>;
};

function mapOdooMappingRow(row: OdooMappingRow): OdooMapping {
  return {
    id: row.id,
    organizationId: row.organization_id,
    bindingType: row.binding_type as OdooBindingType,
    adminbtpEntityId: row.adminbtp_entity_id,
    odooModel: row.odoo_model,
    odooRecordId: row.odoo_record_id,
    syncStatus: row.sync_status,
  };
}

function buildOdooMappingBoardData(
  mappings: OdooMapping[],
  requestedOrganizationId?: string,
): OdooMappingBoardData | null {
  const availableOrganizationIds = Array.from(
    new Set(mappings.map((mapping) => mapping.organizationId)),
  );
  const organizationId =
    requestedOrganizationId && availableOrganizationIds.includes(requestedOrganizationId)
      ? requestedOrganizationId
      : availableOrganizationIds[0];

  if (!organizationId) {
    return null;
  }

  const scopedMappings = mappings.filter(
    (mapping) => mapping.organizationId === organizationId,
  );

  return {
    organizationId,
    customerMapping: findCustomerMappingForOrganization(scopedMappings, organizationId),
    invoiceMappings: getMappingsByType(scopedMappings, "invoice"),
    subscriptionMappings: getMappingsByType(scopedMappings, "subscription"),
    consultingMappings: getMappingsByType(scopedMappings, "consulting_service"),
    dataOrigin: "supabase",
  };
}

export async function createOdooSupabaseReader(): Promise<OdooSupabaseReader | null> {
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const organizationScope = await loadServerOrganizationScope(supabase);

  if (!organizationScope) {
    return null;
  }

  const accessibleOrganizationIds = organizationScope.accessibleOrganizationIds;

  return {
    async listMappings(query) {
      let request = supabase
        .from("odoo_mappings")
        .select("*")
        .in("organization_id", accessibleOrganizationIds)
        .order("created_at", { ascending: true });

      if (query?.organizationId) {
        request = request.eq("organization_id", query.organizationId);
      }

      if (query?.bindingType) {
        request = request.eq("binding_type", query.bindingType);
      }

      const { data, error } = await request;

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  };
}

export async function getOdooMappingBoardData(
  query?: OdooMappingQuery,
  reader?: OdooSupabaseReader | null,
): Promise<OdooMappingBoardData> {
  const resolvedReader =
    reader === undefined ? await createOdooSupabaseReader() : reader;

  if (!resolvedReader) {
    return getDemoOdooMappingBoardData();
  }

  try {
    const mappings = (await resolvedReader.listMappings(query)).map(mapOdooMappingRow);
    const boardData = buildOdooMappingBoardData(mappings, query?.organizationId);

    if (!boardData) {
      return {
        ...getDemoOdooMappingBoardData(),
        fallbackReason: "Aucun mapping Odoo n'a ete trouve en base pour ce perimetre.",
      };
    }

    return boardData;
  } catch {
    return {
      ...getDemoOdooMappingBoardData(),
      fallbackReason: "Lecture Supabase impossible, bascule vers les donnees de demonstration.",
    };
  }
}
