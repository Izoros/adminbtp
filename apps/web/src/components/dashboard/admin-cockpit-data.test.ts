import { describe, expect, it } from "vitest";

import { buildAdminCockpitData } from "@/components/dashboard/admin-cockpit-data";

describe("buildAdminCockpitData", () => {
  it("construit des indicateurs reels et un kanban honnete depuis le snapshot", () => {
    const data = buildAdminCockpitData({
      source: "supabase",
      sourceMessage: "1 organisation consolidee dans le cockpit admin.",
      organizationCount: 1,
      projects: [
        {
          id: "project_1",
          name: "College Mamoudzou",
          status: "active",
          updated_at: "2026-05-25T08:00:00.000Z",
          created_at: "2026-05-01T08:00:00.000Z",
        },
      ],
      documents: [
        {
          id: "document_1",
          title: "CR chantier 12",
          status: "draft",
          updated_at: "2026-05-25T08:30:00.000Z",
          created_at: "2026-05-24T08:30:00.000Z",
        },
      ],
      signatures: [
        {
          id: "signature_1",
          status: "pending_internal_validation",
          updated_at: "2026-05-25T09:00:00.000Z",
          created_at: "2026-05-25T09:00:00.000Z",
        },
      ],
      followups: [
        {
          id: "followup_1",
          status: "scheduled",
          step_label: "Relance J+15",
          scheduled_for: "2026-05-25",
          updated_at: "2026-05-25T06:00:00.000Z",
        },
        {
          id: "followup_2",
          status: "done",
          step_label: "Relance J+7",
          scheduled_for: "2026-05-20",
          updated_at: "2026-05-20T06:00:00.000Z",
        },
      ],
      consultingMissions: [
        {
          id: "mission_1",
          title: "Analyse DOE",
          status: "in_progress",
          sold_hours: 10,
          consumed_hours: 6,
          updated_at: "2026-05-25T07:00:00.000Z",
          created_at: "2026-05-15T07:00:00.000Z",
        },
        {
          id: "mission_2",
          title: "Avis EXE",
          status: "completed",
          sold_hours: 4,
          consumed_hours: 4,
          updated_at: "2026-05-22T07:00:00.000Z",
          created_at: "2026-05-18T07:00:00.000Z",
        },
      ],
      situations: [
        {
          id: "situation_1",
          reference: "SIT-001",
          status: "sent",
          amount_cents: 250000,
          issued_on: "2026-05-10",
        },
      ],
      emails: [
        {
          id: "email_1",
          subject: "Question chantier facade",
          classification: "unclassified",
          received_at: "2026-05-25T05:00:00.000Z",
        },
      ],
      aiSuggestions: [
        {
          id: "ai_1",
          title: "Synthese PPSPS",
          status: "pending_human_validation",
          created_at: "2026-05-25T04:00:00.000Z",
        },
      ],
    });

    expect(data.source).toBe("supabase");
    expect(data.range).toBe("30d");
    expect(data.rangeLabel).toBe("30 derniers jours");
    expect(data.metrics[0]?.value).toBe("1");
    expect(data.metrics[1]?.value).toBe("1");
    expect(data.metrics[3]?.value).toContain("10");
    expect(data.overviewCards[0]?.title).toBe("Flux entrants");
    expect(data.alerts[0]?.title).toContain("validation");
    expect(data.kanbanColumns[0]?.cards[0]?.title).toBe("Question chantier facade");
    expect(data.kanbanColumns[1]?.cards.some((card) => card.title === "Analyse DOE")).toBe(true);
    expect(data.kanbanColumns[2]?.cards.some((card) => card.title === "Synthese PPSPS")).toBe(
      true,
    );
    expect(data.kanbanColumns[3]?.cards.some((card) => card.title === "Avis EXE")).toBe(true);
  });

  it("normalise la periode cockpit et etend les points sur 7 jours", () => {
    const data = buildAdminCockpitData(
      {
        source: "supabase",
        sourceMessage: "1 organisation consolidee dans le cockpit admin.",
        organizationCount: 1,
        projects: [],
        documents: [],
        signatures: [],
        followups: [],
        consultingMissions: [],
        situations: [],
        emails: [],
        aiSuggestions: [],
      },
      { range: "7d" },
    );

    expect(data.range).toBe("7d");
    expect(data.rangeLabel).toBe("7 derniers jours");
    expect(data.loadSeries).toHaveLength(7);
  });
});
