import "server-only";

import { loadServerOrganizationScope } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { buildOdooConnectionReadiness } from "@/modules/settings/services/odoo-connector";
import {
  findCustomerMappingForOrganization,
  getMappingsByType,
} from "@/modules/settings/services/odoo-mapping";
import type {
  OdooBindingType,
  OdooMapping,
  OdooMappingBoardData,
  OdooMappingQuery,
  OdooSocialBindingType,
} from "@/modules/settings/types/odoo";
import type { Tables } from "@/types/supabase";

type OdooMappingRow = Tables<"odoo_mappings">;

const socialBindingTypes: OdooSocialBindingType[] = [
  "employee",
  "employment_contract",
  "attendance",
  "time_off",
  "timesheet",
  "payslip",
];

function buildSocialMappings(mappings: OdooMapping[]) {
  return Object.fromEntries(
    socialBindingTypes.map((bindingType) => [
      bindingType,
      getMappingsByType(mappings, bindingType),
    ]),
  ) as Record<OdooSocialBindingType, OdooMapping[]>;
}

export type OdooSupabaseReader = {
  listMappings: (query?: OdooMappingQuery) => Promise<OdooMappingRow[]>;
  accessibleOrganizationIds: string[];
  preferredOrganizationId: string | null;
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
    socialMappings: buildSocialMappings(scopedMappings),
    connectionReadiness: buildOdooConnectionReadiness(),
    canWrite: true,
    dataOrigin: "supabase",
  };
}

function buildEmptyOdooMappingBoardData(
  organizationId: string,
  fallbackReason?: string,
  canWrite = false,
): OdooMappingBoardData {
  return {
    organizationId,
    customerMapping: undefined,
    invoiceMappings: [],
    subscriptionMappings: [],
    consultingMappings: [],
    socialMappings: buildSocialMappings([]),
    connectionReadiness: buildOdooConnectionReadiness(),
    canWrite,
    dataOrigin: "supabase",
    fallbackReason,
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
    accessibleOrganizationIds,
    preferredOrganizationId: organizationScope.preferredOrganizationId,
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
    return buildEmptyOdooMappingBoardData(
      query?.organizationId ?? "organization_indisponible",
      "Lecture Odoo indisponible pour cette session.",
    );
  }

  try {
    const mappings = (await resolvedReader.listMappings(query)).map(mapOdooMappingRow);
    const boardData = buildOdooMappingBoardData(mappings, query?.organizationId);

    if (!boardData) {
      if (
        query?.organizationId &&
        !resolvedReader.accessibleOrganizationIds.includes(query.organizationId)
      ) {
        return buildEmptyOdooMappingBoardData(
          "organization_indisponible",
          "L'organisation demandee ne fait pas partie du perimetre autorise.",
        );
      }

      const preferredOrganizationId = resolvedReader.preferredOrganizationId;
      const targetOrganizationId =
        query?.organizationId ??
        (preferredOrganizationId &&
        resolvedReader.accessibleOrganizationIds.includes(preferredOrganizationId)
          ? preferredOrganizationId
          : resolvedReader.accessibleOrganizationIds[0]);

      if (targetOrganizationId) {
        return buildEmptyOdooMappingBoardData(
          targetOrganizationId,
          "Aucun mapping Odoo n'a encore ete trouve en base pour ce perimetre.",
          true,
        );
      }

      return buildEmptyOdooMappingBoardData(
        "organization_indisponible",
        "Aucune organisation accessible n'a pu etre resolue pour Odoo.",
      );
    }

    return boardData;
  } catch {
    return buildEmptyOdooMappingBoardData(
      query?.organizationId ?? "organization_indisponible",
      "Lecture Supabase impossible pour les mappings Odoo.",
    );
  }
}
