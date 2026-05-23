import type {
  OdooMapping,
  OdooMappingBoardData,
} from "@/modules/settings/types/odoo";
import {
  findCustomerMappingForOrganization,
  getMappingsByType,
} from "@/modules/settings/services/odoo-mapping";

export const demoOdooMappings: OdooMapping[] = [
  {
    id: "odoo_map_001",
    organizationId: "org_adminbtp_001",
    bindingType: "customer",
    adminbtpEntityId: "org_adminbtp_001",
    odooModel: "res.partner",
    odooRecordId: "odoo_partner_1042",
    syncStatus: "linked",
  },
  {
    id: "odoo_map_002",
    organizationId: "org_adminbtp_001",
    bindingType: "invoice",
    adminbtpEntityId: "situation_001",
    odooModel: "account.move",
    odooRecordId: "odoo_invoice_8891",
    syncStatus: "ready",
  },
  {
    id: "odoo_map_003",
    organizationId: "org_adminbtp_001",
    bindingType: "subscription",
    adminbtpEntityId: "subscription_admin_001",
    odooModel: "sale.subscription",
    odooRecordId: "odoo_subscription_2001",
    syncStatus: "linked",
  },
  {
    id: "odoo_map_004",
    organizationId: "org_adminbtp_001",
    bindingType: "consulting_service",
    adminbtpEntityId: "consulting_mission_demo_001",
    odooModel: "product.product",
    odooRecordId: "odoo_product_771",
    syncStatus: "linked",
  },
];

export function getDemoOdooMappingBoardData(): OdooMappingBoardData {
  const organizationId = "org_adminbtp_001";

  return {
    organizationId,
    customerMapping: findCustomerMappingForOrganization(
      demoOdooMappings,
      organizationId,
    ),
    invoiceMappings: getMappingsByType(demoOdooMappings, "invoice"),
    subscriptionMappings: getMappingsByType(demoOdooMappings, "subscription"),
    consultingMappings: getMappingsByType(
      demoOdooMappings,
      "consulting_service",
    ),
    dataOrigin: "demo",
  };
}
