import {
  demoPhaseChecklistItems,
  demoProjectPhases,
} from "@/modules/phases/services/demo-phases";
import {
  canTransitionPhaseToCompleted,
  getPhaseProfileFromProjectRole,
  getPhasesForProfile,
  getRecommendedNextStatus,
} from "@/modules/phases/services/phase-rules";

describe("regles de phases chantier", () => {
  it("retourne des phases differentes selon le profil metier", () => {
    const moePhases = getPhasesForProfile("moe", demoProjectPhases);
    const moaPhases = getPhasesForProfile("moa", demoProjectPhases);
    const tcePhases = getPhasesForProfile("tce", demoProjectPhases);
    const tradePhases = getPhasesForProfile(
      "trade_contractor",
      demoProjectPhases,
    );

    expect(moePhases[0]?.code).toBe("moe-visa-exe");
    expect(moaPhases[0]?.code).toBe("moa-validation-budget");
    expect(tcePhases[0]?.code).toBe("tce-preparation-situation");
    expect(tradePhases[0]?.code).toBe("lot-remise-documents");
  });

  it("active le profil de phase OPC", () => {
    expect(getPhaseProfileFromProjectRole("opc")).toBe("opc");
  });

  it("bloque la transition si la checklist obligatoire n'est pas complete", () => {
    expect(
      canTransitionPhaseToCompleted("phase_moe_001", demoPhaseChecklistItems),
    ).toBe(false);
  });

  it("autorise la transition si tous les points obligatoires sont complets", () => {
    expect(
      canTransitionPhaseToCompleted("phase_moa_001", demoPhaseChecklistItems),
    ).toBe(true);
    expect(
      getRecommendedNextStatus(
        "phase_moa_001",
        "ready_for_review",
        demoPhaseChecklistItems,
      ),
    ).toBe("completed");
  });
});
