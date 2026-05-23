import { vi } from "vitest";

import {
  getFollowupDashboardData,
  selectSituationForFollowups,
} from "@/modules/followups/services/supabase-followup-data";
import type { FollowupSupabaseReader } from "@/modules/followups/services/supabase-followup-data";
import type { Tables } from "@/types/supabase";

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

describe("chargement tresorerie via Supabase", () => {
  it("bascule sur la demonstration sans lecteur Supabase", async () => {
    const data = await getFollowupDashboardData(undefined, null);

    expect(data.dataOrigin).toBe("demo");
    expect(data.followups).toHaveLength(4);
  });

  it("retourne les relances persistantes si elles existent en base", async () => {
    const reader: FollowupSupabaseReader = {
      listSituations: async () => [createSituation()],
      listFollowupsBySituation: async () => [createFollowup()],
    };

    const data = await getFollowupDashboardData(undefined, reader);

    expect(data.dataOrigin).toBe("supabase");
    expect(data.followups).toHaveLength(1);
    expect(data.followups[0]?.stepLabel).toBe("Relance J+7");
  });

  it("transmet les filtres de recherche a la lecture Supabase", async () => {
    const listSituations = vi.fn(async () => [createSituation()]);
    const reader: FollowupSupabaseReader = {
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
    expect(data.situation.id).toBe("situation_001");
  });

  it("recalcule le planning si la situation existe mais pas encore les relances", async () => {
    const reader: FollowupSupabaseReader = {
      listSituations: async () => [createSituation()],
      listFollowupsBySituation: async () => [],
    };

    const data = await getFollowupDashboardData(undefined, reader);

    expect(data.dataOrigin).toBe("supabase");
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
