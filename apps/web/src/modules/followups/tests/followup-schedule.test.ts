import { demoSituations } from "@/modules/followups/services/demo-followups";
import { generateFollowupSchedule } from "@/modules/followups/services/followup-schedule";

describe("planning de relance", () => {
  it("genere les relances J+7, J+15, J+30 et J+45", () => {
    const followups = generateFollowupSchedule(demoSituations[0]!);

    expect(followups.map((followup) => followup.daysAfterDue)).toEqual([
      7, 15, 30, 45,
    ]);
  });

  it("calcule les bonnes dates planifiees a partir de l'echeance", () => {
    const followups = generateFollowupSchedule(demoSituations[0]!);

    expect(followups[0]?.scheduledFor).toBe("2026-05-27");
    expect(followups[1]?.scheduledFor).toBe("2026-06-04");
    expect(followups[2]?.scheduledFor).toBe("2026-06-19");
    expect(followups[3]?.scheduledFor).toBe("2026-07-04");
  });
});
