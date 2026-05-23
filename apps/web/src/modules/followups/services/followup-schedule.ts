import type { PaymentFollowup, Situation } from "@/modules/followups/types/followup";

const followupOffsets = [7, 15, 30, 45] as const;

function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function generateFollowupSchedule(situation: Situation): PaymentFollowup[] {
  return followupOffsets.map((daysAfterDue) => ({
    id: `${situation.id}_j${daysAfterDue}`,
    situationId: situation.id,
    organizationId: situation.organizationId,
    stepLabel: `Relance J+${daysAfterDue}`,
    daysAfterDue,
    scheduledFor: addDays(situation.dueOn, daysAfterDue),
    status: "scheduled",
  }));
}
