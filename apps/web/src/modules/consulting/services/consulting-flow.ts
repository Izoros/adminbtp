import type {
  ConsultingHour,
  ConsultingMission,
  ExpertRequest,
  TechnicalReview,
} from "@/modules/consulting/types/consulting";

export function getMissionByRequestId(
  missions: ConsultingMission[],
  expertRequestId: string,
) {
  return missions.find((mission) => mission.expertRequestId === expertRequestId) ?? null;
}

export function getHoursForMission(
  hours: ConsultingHour[],
  consultingMissionId: string,
) {
  return hours.filter((hour) => hour.consultingMissionId === consultingMissionId);
}

export function getReviewForRequest(
  reviews: TechnicalReview[],
  expertRequestId: string,
) {
  return reviews.find((review) => review.expertRequestId === expertRequestId) ?? null;
}

export function getConsultingJourneyState(
  request: ExpertRequest,
  missions: ConsultingMission[],
  hours: ConsultingHour[],
  reviews: TechnicalReview[],
) {
  const mission = getMissionByRequestId(missions, request.id);
  const missionHours = mission ? getHoursForMission(hours, mission.id) : [];
  const review = getReviewForRequest(reviews, request.id);

  return {
    request,
    mission,
    missionHours,
    review,
  };
}
