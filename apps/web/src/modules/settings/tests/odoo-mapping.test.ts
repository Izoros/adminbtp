import { demoOdooMappings } from "@/modules/settings/services/demo-odoo";
import {
  findCustomerMappingForOrganization,
  getMappingsByType,
} from "@/modules/settings/services/odoo-mapping";

describe("mapping Odoo", () => {
  it("retrouve le mapping client d'une organisation AdminBTP", () => {
    const mapping = findCustomerMappingForOrganization(
      demoOdooMappings,
      "org_adminbtp_001",
    );

    expect(mapping?.odooModel).toBe("res.partner");
    expect(mapping?.odooRecordId).toBe("odoo_partner_1042");
  });

  it("filtre les mappings par type metier", () => {
    expect(getMappingsByType(demoOdooMappings, "invoice")).toHaveLength(1);
    expect(getMappingsByType(demoOdooMappings, "subscription")).toHaveLength(1);
    expect(getMappingsByType(demoOdooMappings, "consulting_service")).toHaveLength(1);
  });
});
