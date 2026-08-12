import { beforeEach, vi } from "vitest";

import { createClient } from "@/lib/supabase/server";
import { loadServerOrganizationScope } from "@/lib/permissions";
import { demoOdooMappings } from "@/modules/settings/services/demo-odoo";
import {
  findCustomerMappingForOrganization,
  getMappingsByType,
} from "@/modules/settings/services/odoo-mapping";
import {
  createOdooSupabaseReader,
  getOdooMappingBoardData,
} from "@/modules/settings/services/supabase-odoo-data";
import type { OdooSupabaseReader } from "@/modules/settings/services/supabase-odoo-data";
import type { Tables } from "@/types/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/permissions", async () => {
  const actual = await vi.importActual<typeof import("@/lib/permissions")>("@/lib/permissions");

  return {
    ...actual,
    loadServerOrganizationScope: vi.fn(),
  };
});

function createOdooMapping(
  overrides: Partial<Tables<"odoo_mappings">> = {},
): Tables<"odoo_mappings"> {
  return {
    id: "odoo_map_001",
    adminbtp_entity_id: "org_adminbtp_001",
    binding_type: "customer",
    created_at: "2026-05-10T00:00:00.000Z",
    created_by: "user_001",
    odoo_model: "res.partner",
    odoo_record_id: "odoo_partner_1042",
    organization_id: "org_adminbtp_001",
    sync_status: "linked",
    updated_at: "2026-05-10T00:00:00.000Z",
    ...overrides,
  };
}

function createReader(overrides: Partial<OdooSupabaseReader> = {}): OdooSupabaseReader {
  return {
    accessibleOrganizationIds: ["org_adminbtp_001"],
    listMappings: async () => [createOdooMapping()],
    preferredOrganizationId: "org_adminbtp_001",
    ...overrides,
  };
}

function createSelectQueryResult<T>(data: T) {
  const query = {
    select: vi.fn(() => query),
    in: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    data,
    error: null,
  };

  return query;
}

beforeEach(() => {
  vi.clearAllMocks();
});

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

  it("classe les mappings sociaux Odoo", async () => {
    const data = await getOdooMappingBoardData(
      { organizationId: "org_adminbtp_001" },
      createReader({
        listMappings: async () => [
          createOdooMapping({
            id: "odoo_employee_001",
            adminbtp_entity_id: "employee_001",
            binding_type: "employee",
            odoo_model: "hr.employee",
            odoo_record_id: "410",
          }),
        ],
      }),
    );

    expect(data.socialMappings.employee).toHaveLength(1);
    expect(data.socialMappings.payslip).toHaveLength(0);
  });

  it("applique le scope organisation sur la lecture des mappings Odoo", async () => {
    const mappingQuery = createSelectQueryResult([createOdooMapping()]);
    const from = vi.fn((table: string) => {
      if (table === "odoo_mappings") {
        return mappingQuery;
      }

      throw new Error(`Table inattendue: ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue({
      from,
    } as never);
    vi.mocked(loadServerOrganizationScope).mockResolvedValue({
      accessibleOrganizationIds: ["org_adminbtp_001", "org_adminbtp_002"],
      preferredOrganizationId: "org_adminbtp_001",
      memberships: [],
      userId: "user_001",
      internalRole: "member",
    });

    const reader = await createOdooSupabaseReader();

    expect(reader).not.toBeNull();
    await reader?.listMappings({
      organizationId: "org_adminbtp_001",
      bindingType: "customer",
    });

    expect(mappingQuery.in).toHaveBeenCalledWith("organization_id", [
      "org_adminbtp_001",
      "org_adminbtp_002",
    ]);
    expect(mappingQuery.eq).toHaveBeenCalledWith("organization_id", "org_adminbtp_001");
    expect(mappingQuery.eq).toHaveBeenCalledWith("binding_type", "customer");
  });

  it("retourne un etat vide Supabase sans lecteur Supabase", async () => {
    const data = await getOdooMappingBoardData(undefined, null);

    expect(data.dataOrigin).toBe("supabase");
    expect(data.customerMapping).toBeUndefined();
    expect(data.canWrite).toBe(false);
  });

  it("retourne les mappings Supabase si le perimetre contient des liaisons", async () => {
    const data = await getOdooMappingBoardData(
      {
        organizationId: "org_adminbtp_001",
      },
      createReader({
        listMappings: async () => [
          createOdooMapping(),
          createOdooMapping({
            id: "odoo_map_002",
            adminbtp_entity_id: "situation_001",
            binding_type: "invoice",
            odoo_model: "account.move",
            odoo_record_id: "odoo_invoice_8891",
          }),
        ],
      }),
    );

    expect(data.dataOrigin).toBe("supabase");
    expect(data.organizationId).toBe("org_adminbtp_001");
    expect(data.invoiceMappings).toHaveLength(1);
    expect(data.canWrite).toBe(true);
  });

  it("refuse un perimetre demande qui n'est pas autorise", async () => {
    const data = await getOdooMappingBoardData(
      {
        organizationId: "org_inconnue",
      },
      createReader({
        listMappings: async () => [],
      }),
    );

    expect(data.dataOrigin).toBe("supabase");
    expect(data.organizationId).toBe("organization_indisponible");
    expect(data.canWrite).toBe(false);
    expect(data.fallbackReason).toContain("perimetre autorise");
  });

  it("reste en source Supabase vide si le scope est resolu mais qu'aucun mapping n'existe encore", async () => {
    const data = await getOdooMappingBoardData(
      {
        organizationId: "org_adminbtp_001",
      },
      createReader({
        accessibleOrganizationIds: ["org_adminbtp_001"],
        listMappings: async () => [],
        preferredOrganizationId: "org_adminbtp_001",
      }),
    );

    expect(data.dataOrigin).toBe("supabase");
    expect(data.organizationId).toBe("org_adminbtp_001");
    expect(data.customerMapping).toBeUndefined();
    expect(data.invoiceMappings).toHaveLength(0);
    expect(data.canWrite).toBe(true);
    expect(data.fallbackReason).toContain("Aucun mapping Odoo n'a encore ete trouve");
  });
});
