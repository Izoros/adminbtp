import { beforeEach, vi } from "vitest";

import {
  createFollowupSupabaseReader,
  getFollowupDashboardData,
  selectSituationForFollowups,
} from "@/modules/followups/services/supabase-followup-data";
import type { FollowupSupabaseReader } from "@/modules/followups/services/supabase-followup-data";
import { createClient } from "@/lib/supabase/server";
import { loadServerOrganizationScope } from "@/lib/permissions";
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

function createSituation(
  overrides: Partial<Tables<"situations">> = {},
): Tables<"situations"> {
  return {
    id: "situation_001",
    amount_cents: 245000,
    created_at: "2026-05-10T00:00:00.000Z",
    created_by: "user_001",
    currency_code: "EUR",
    customer_name: "Collectivite Client College",
    due_on: "2026-05-20",
    issued_on: "2026-05-10",
    organization_id: "org_adminbtp_001",
    project_id: "project_001",
    reference: "SIT-2026-05-001",
    status: "sent",
    updated_at: "2026-05-10T00:00:00.000Z",
    ...overrides,
  };
}

function createFollowup(
  overrides: Partial<Tables<"payment_followups">> = {},
): Tables<"payment_followups"> {
  return {
    id: "followup_001",
    created_at: "2026-05-21T00:00:00.000Z",
    days_after_due: 7,
    organization_id: "org_adminbtp_001",
    scheduled_for: "2026-05-27",
    situation_id: "situation_001",
    status: "scheduled",
    step_label: "Relance J+7",
    updated_at: "2026-05-21T00:00:00.000Z",
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

describe("chargement tresorerie via Supabase", () => {
  it("applique le scope organisation sur la lecture des situations", async () => {
    const situationQuery = createSelectQueryResult([createSituation()]);
    const from = vi.fn((table: string) => {
      if (table === "situations") {
        return situationQuery;
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

    const reader = await createFollowupSupabaseReader();

    expect(reader).not.toBeNull();
    await reader?.listSituations({
      organizationId: "org_adminbtp_001",
      projectId: "project_001",
      situationId: "situation_001",
    });

    expect(situationQuery.in).toHaveBeenCalledWith("organization_id", [
      "org_adminbtp_001",
      "org_adminbtp_002",
    ]);
    expect(situationQuery.eq).toHaveBeenCalledWith("organization_id", "org_adminbtp_001");
    expect(situationQuery.eq).toHaveBeenCalledWith("project_id", "project_001");
    expect(situationQuery.eq).toHaveBeenCalledWith("id", "situation_001");
  });

  it("applique le scope organisation sur la lecture des relances persistantes", async () => {
    const followupQuery = createSelectQueryResult([createFollowup()]);
    const from = vi.fn((table: string) => {
      if (table === "payment_followups") {
        return followupQuery;
      }

      throw new Error(`Table inattendue: ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue({
      from,
    } as never);
    vi.mocked(loadServerOrganizationScope).mockResolvedValue({
      accessibleOrganizationIds: ["org_adminbtp_001"],
      preferredOrganizationId: "org_adminbtp_001",
      memberships: [],
      userId: "user_001",
      internalRole: "member",
    });

    const reader = await createFollowupSupabaseReader();

    expect(reader).not.toBeNull();
    await reader?.listFollowupsBySituation("situation_001");

    expect(followupQuery.in).toHaveBeenCalledWith("organization_id", ["org_adminbtp_001"]);
    expect(followupQuery.eq).toHaveBeenCalledWith("situation_id", "situation_001");
  });

  it("retourne un etat vide Supabase sans lecteur Supabase", async () => {
    const data = await getFollowupDashboardData(undefined, null);

    expect(data.dataOrigin).toBe("supabase");
    expect(data.persistenceMode).toBe("generated");
    expect(data.followups).toEqual([]);
  });

  it("reste en source Supabase vide si aucune situation n'existe encore", async () => {
    const reader: FollowupSupabaseReader = {
      accessibleOrganizationIds: ["org_adminbtp_001"],
      preferredOrganizationId: "org_adminbtp_001",
      listSituations: async () => [],
      listFollowupsBySituation: async () => [],
    };

    const data = await getFollowupDashboardData(
      {
        organizationId: "org_adminbtp_001",
      },
      reader,
    );

    expect(data.dataOrigin).toBe("supabase");
    expect(data.situation).toBeUndefined();
    expect(data.followups).toHaveLength(0);
    expect(data.fallbackReason).toContain("Aucune situation");
  });

  it("retourne les relances persistantes si elles existent en base", async () => {
    const reader: FollowupSupabaseReader = {
      accessibleOrganizationIds: ["org_adminbtp_001"],
      preferredOrganizationId: "org_adminbtp_001",
      listSituations: async () => [createSituation()],
      listFollowupsBySituation: async () => [createFollowup()],
    };

    const data = await getFollowupDashboardData(undefined, reader);

    expect(data.dataOrigin).toBe("supabase");
    expect(data.persistenceMode).toBe("persisted");
    expect(data.followups).toHaveLength(1);
    expect(data.followups[0]?.stepLabel).toBe("Relance J+7");
  });

  it("transmet les filtres de recherche a la lecture Supabase", async () => {
    const listSituations = vi.fn(async () => [createSituation()]);
    const reader: FollowupSupabaseReader = {
      accessibleOrganizationIds: ["org_adminbtp_001"],
      preferredOrganizationId: "org_adminbtp_001",
      listSituations,
      listFollowupsBySituation: async () => [createFollowup()],
    };

    const data = await getFollowupDashboardData(
      {
        organizationId: "org_adminbtp_001",
        projectId: "project_001",
        situationId: "situation_001",
      },
      reader,
    );

    expect(listSituations).toHaveBeenCalledWith({
      organizationId: "org_adminbtp_001",
      projectId: "project_001",
      situationId: "situation_001",
    });
    expect(data.situation?.id).toBe("situation_001");
  });

  it("recalcule le planning si la situation existe mais pas encore les relances", async () => {
    const reader: FollowupSupabaseReader = {
      accessibleOrganizationIds: ["org_adminbtp_001"],
      preferredOrganizationId: "org_adminbtp_001",
      listSituations: async () => [createSituation()],
      listFollowupsBySituation: async () => [],
    };

    const data = await getFollowupDashboardData(undefined, reader);

    expect(data.dataOrigin).toBe("supabase");
    expect(data.persistenceMode).toBe("generated");
    expect(data.followups).toHaveLength(4);
    expect(data.fallbackReason).toContain("Aucune relance");
  });

  it("selectionne en priorite une situation encore actionnable", () => {
    const selectedSituation = selectSituationForFollowups([
      {
        id: "situation_paid",
        organizationId: "org_adminbtp_001",
        reference: "SIT-PAID",
        customerName: "Client A",
        amountCents: 1000,
        currencyCode: "EUR",
        issuedOn: "2026-05-01",
        dueOn: "2026-05-10",
        status: "paid",
      },
      {
        id: "situation_sent",
        organizationId: "org_adminbtp_001",
        reference: "SIT-SENT",
        customerName: "Client B",
        amountCents: 2000,
        currencyCode: "EUR",
        issuedOn: "2026-05-02",
        dueOn: "2026-05-12",
        status: "sent",
      },
    ]);

    expect(selectedSituation?.id).toBe("situation_sent");
  });
});
