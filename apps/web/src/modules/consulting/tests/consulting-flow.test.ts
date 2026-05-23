import {
  demoConsultingHours,
  demoConsultingMissions,
  demoExpertRequests,
  demoTechnicalReviews,
} from "@/modules/consulting/services/demo-consulting";
import {
  getConsultingJourneyState,
  getMissionByRequestId,
  getReviewForRequest,
} from "@/modules/consulting/services/consulting-flow";

describe("cycle consulting", () => {
  it("retrouve la mission rattachee a une demande expert", () => {
    const mission = getMissionByRequestId(
      demoConsultingMissions,
      "expert_request_001",
    );

    expect(mission?.missionNumber).toBe("CM-010");
  });

  it("retrouve l'avis technique produit pour la demande", () => {
    const review = getReviewForRequest(
      demoTechnicalReviews,
      "expert_request_001",
    );

    expect(review?.title).toContain("DOE");
  });

  it("recompose le parcours demande -> mission -> revue", () => {
    const state = getConsultingJourneyState(
      demoExpertRequests[0]!,
      demoConsultingMissions,
      demoConsultingHours,
      demoTechnicalReviews,
    );

    expect(state.missionHours).toHaveLength(2);
    expect(state.review?.status).toBe("ready_for_validation");
  });
});
