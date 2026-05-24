import { beforeEach, describe, expect, it, vi } from "vitest";

import { ScopeGuardError } from "@/lib/permissions";
import { buildInitialOdooMutationState } from "@/modules/settings/services/odoo-action-state";
import {
  upsertCustomerOdooMappingAction,
  upsertOdooMappingAction,
} from "@/modules/settings/services/odoo-actions";

const createClientMock = vi.fn();
const loadServerOrganizationScopeMock = vi.fn();
const assertOrganizationAccessMock = vi.fn();
const revalidatePathMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));

vi.mock("@/lib/permissions", async () => {
  const actual = await vi.importActual<typeof import("@/lib/permissions")>("@/lib/permissions");

  return {
    ...actual,
    loadServerOrganizationScope: (...args: unknown[]) =>
      loadServerOrganizationScopeMock(...args),
    assertOrganizationAccess: (...args: unknown[]) => assertOrganizationAccessMock(...args),
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

describe("actions odoo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadServerOrganizationScopeMock.mockResolvedValue({
      accessibleOrganizationIds: ["org_adminbtp_001"],
    });
    assertOrganizationAccessMock.mockImplementation(() => undefined);
  });

  it("cree un mapping client Odoo dans Supabase", async () => {
    const existingMaybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "odoo_mappings") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: existingMaybeSingle,
                })),
              })),
            })),
          })),
          insert,
        };
      }

      throw new Error(`Table inattendue: ${table}`);
    });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user_admin_001" } },
          error: null,
        }),
      },
      from,
    });

    const formData = new FormData();
    formData.set("organizationId", "org_adminbtp_001");
    formData.set("odooModel", "res.partner");
    formData.set("odooRecordId", "odoo_partner_2048");
    formData.set("syncStatus", "linked");

    const result = await upsertCustomerOdooMappingAction(
      buildInitialOdooMutationState(),
      formData,
    );

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org_adminbtp_001",
        binding_type: "customer",
        adminbtp_entity_id: "org_adminbtp_001",
        odoo_record_id: "odoo_partner_2048",
        created_by: "user_admin_001",
      }),
    );
    expect(result).toEqual({
      status: "success",
      mode: "supabase",
      message: "Mapping client Odoo cree dans Supabase.",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/odoo");
  });

  it("met a jour un mapping client Odoo existant", async () => {
    const existingMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: "odoo_map_001" },
      error: null,
    });
    const updateEqOrganization = vi.fn().mockResolvedValue({ error: null });
    const updateEqId = vi.fn(() => ({
      eq: updateEqOrganization,
    }));
    const update = vi.fn(() => ({
      eq: updateEqId,
    }));
    const from = vi.fn((table: string) => {
      if (table === "odoo_mappings") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: existingMaybeSingle,
                })),
              })),
            })),
          })),
          update,
        };
      }

      throw new Error(`Table inattendue: ${table}`);
    });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user_admin_001" } },
          error: null,
        }),
      },
      from,
    });

    const formData = new FormData();
    formData.set("organizationId", "org_adminbtp_001");
    formData.set("odooModel", "res.partner");
    formData.set("odooRecordId", "odoo_partner_9000");
    formData.set("syncStatus", "synced");

    const result = await upsertCustomerOdooMappingAction(
      buildInitialOdooMutationState(),
      formData,
    );

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        odoo_record_id: "odoo_partner_9000",
        sync_status: "synced",
      }),
    );
    expect(result).toEqual({
      status: "success",
      mode: "supabase",
      message: "Mapping client Odoo mis a jour dans Supabase.",
    });
  });

  it("refuse l'ecriture si l'organisation sort du scope serveur", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user_admin_001" } },
          error: null,
        }),
      },
      from: vi.fn(),
    });
    assertOrganizationAccessMock.mockImplementation(() => {
      throw new ScopeGuardError(
        "organization_access_denied",
        "Le scope serveur courant ne couvre pas cette organisation.",
      );
    });

    const formData = new FormData();
    formData.set("organizationId", "org_interdite");
    formData.set("odooModel", "res.partner");
    formData.set("odooRecordId", "odoo_partner_9000");

    const result = await upsertCustomerOdooMappingAction(
      buildInitialOdooMutationState(),
      formData,
    );

    expect(result).toEqual({
      status: "error",
      mode: "supabase",
      message: "Le scope serveur courant ne couvre pas cette organisation.",
    });
  });

  it("cree un mapping facture Odoo via l'action generique", async () => {
    const existingMaybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "odoo_mappings") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: existingMaybeSingle,
                })),
              })),
            })),
          })),
          insert,
        };
      }

      throw new Error(`Table inattendue: ${table}`);
    });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user_admin_001" } },
          error: null,
        }),
      },
      from,
    });

    const formData = new FormData();
    formData.set("organizationId", "org_adminbtp_001");
    formData.set("bindingType", "invoice");
    formData.set("adminbtpEntityId", "invoice_adminbtp_001");
    formData.set("odooModel", "account.move");
    formData.set("odooRecordId", "odoo_invoice_8891");
    formData.set("syncStatus", "linked");

    const result = await upsertOdooMappingAction(
      buildInitialOdooMutationState(),
      formData,
    );

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org_adminbtp_001",
        binding_type: "invoice",
        adminbtp_entity_id: "invoice_adminbtp_001",
        odoo_model: "account.move",
        odoo_record_id: "odoo_invoice_8891",
      }),
    );
    expect(result).toEqual({
      status: "success",
      mode: "supabase",
      message: "Mapping facture Odoo cree dans Supabase.",
    });
  });

  it("complete automatiquement l'entite AdminBTP pour le mapping client delegue", async () => {
    const existingMaybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "odoo_mappings") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: existingMaybeSingle,
                })),
              })),
            })),
          })),
          insert,
        };
      }

      throw new Error(`Table inattendue: ${table}`);
    });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user_admin_001" } },
          error: null,
        }),
      },
      from,
    });

    const formData = new FormData();
    formData.set("organizationId", "org_adminbtp_001");
    formData.set("odooModel", "res.partner");
    formData.set("odooRecordId", "odoo_partner_2048");

    await upsertCustomerOdooMappingAction(
      buildInitialOdooMutationState(),
      formData,
    );

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        binding_type: "customer",
        adminbtp_entity_id: "org_adminbtp_001",
      }),
    );
  });
});
