import type { OdooBindingType, OdooMapping } from "@/modules/settings/types/odoo";

export function getMappingsByType(
  mappings: OdooMapping[],
  bindingType: OdooBindingType,
) {
  return mappings.filter((mapping) => mapping.bindingType === bindingType);
}

export function findCustomerMappingForOrganization(
  mappings: OdooMapping[],
  organizationId: string,
) {
  return mappings.find(
    (mapping) =>
      mapping.bindingType === "customer" &&
      mapping.organizationId === organizationId,
  );
}
