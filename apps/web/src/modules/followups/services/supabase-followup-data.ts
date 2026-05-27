import { createClient } from "@/lib/supabase/server";
import { loadServerOrganizationScope } from "@/lib/permissions";
import { generateFollowupSchedule } from "@/modules/followups/services/followup-schedule";
import type {
  FollowupDashboardData,
  FollowupDashboardQuery,
  PaymentFollowup,
  Situation,
} from "@/modules/followups/types/followup";
import type { Tables } from "@/types/supabase";

type SituationRow = Tables<"situations">;
type PaymentFollowupRow = Tables<"payment_followups">;

export type FollowupSupabaseReader = {
  accessibleOrganizationIds: string[];
  preferredOrganizationId: string | null;
  listSituations: (query?: FollowupDashboardQuery) => Promise<SituationRow[]>;
  listFollowupsBySituation: (situationId: string) => Promise<PaymentFollowupRow[]>;
};

function isSituationActionable(status: Situation["status"]) {
  return status === "sent" || status === "partially_paid" || status === "disputed";
}

export function selectSituationForFollowups(situations: Situation[]) {
  return situations.find((situation) => isSituationActionable(situation.status)) ?? situations[0];
}

function mapSituationRow(situation: SituationRow): Situation {
  return {
    id: situation.id,
    organizationId: situation.organization_id,
    projectId: situation.project_id ?? undefined,
    reference: situation.reference,
    customerName: situation.customer_name,
    amountCents: situation.amount_cents,
    currencyCode: situation.currency_code,
    issuedOn: situation.issued_on,
    dueOn: situation.due_on,
    status: situation.status,
  };
}

function mapFollowupRow(followup: PaymentFollowupRow): PaymentFollowup {
  return {
    id: followup.id,
    situationId: followup.situation_id,
    organizationId: followup.organization_id,
    stepLabel: followup.step_label,
    daysAfterDue: followup.days_after_due,
    scheduledFor: followup.scheduled_for,
    status: followup.status,
  };
}

export async function createFollowupSupabaseReader(): Promise<FollowupSupabaseReader | null> {
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const organizationScope = await loadServerOrganizationScope(supabase);

  if (!organizationScope) {
    return null;
  }

  const accessibleOrganizationIds = organizationScope.accessibleOrganizationIds;

  return {
    accessibleOrganizationIds,
    preferredOrganizationId: organizationScope.preferredOrganizationId,
    async listSituations(query) {
      let request = supabase
        .from("situations")
        .select("*")
        .in("organization_id", accessibleOrganizationIds)
        .order("issued_on", { ascending: false });

      if (query?.organizationId) {
        request = request.eq("organization_id", query.organizationId);
      }

      if (query?.projectId) {
        request = request.eq("project_id", query.projectId);
      }

      if (query?.situationId) {
        request = request.eq("id", query.situationId);
      }

      const { data, error } = await request;

      if (error) {
        throw error;
      }

      return data ?? [];
    },
    async listFollowupsBySituation(situationId) {
      const { data, error } = await supabase
        .from("payment_followups")
        .select("*")
        .eq("situation_id", situationId)
        .in("organization_id", accessibleOrganizationIds)
        .order("scheduled_for", { ascending: true });

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  };
}

export async function getFollowupDashboardData(
  query?: FollowupDashboardQuery,
  reader?: FollowupSupabaseReader | null,
): Promise<FollowupDashboardData> {
  const resolvedReader = reader ?? (await createFollowupSupabaseReader());

  if (!resolvedReader) {
    return {
      situation: undefined,
      followups: [],
      dataOrigin: "supabase",
      persistenceMode: "generated",
      fallbackReason: "Configuration Supabase absente ou lecture distante indisponible.",
    };
  }

  try {
    const situations = await resolvedReader.listSituations(query);
    const mappedSituations = situations.map(mapSituationRow);
    const situation = selectSituationForFollowups(mappedSituations);

    if (!situation) {
      return {
        situation: undefined,
        followups: [],
        dataOrigin: "supabase",
        persistenceMode: "generated",
        fallbackReason:
          "Aucune situation n'a encore ete trouvee en base pour le perimetre courant.",
      };
    }

    const persistedFollowups = await resolvedReader.listFollowupsBySituation(
      situation.id,
    );

    return {
      situation,
      followups:
        persistedFollowups.length > 0
          ? persistedFollowups.map(mapFollowupRow)
          : generateFollowupSchedule(situation),
      dataOrigin: "supabase",
      persistenceMode: persistedFollowups.length > 0 ? "persisted" : "generated",
      fallbackReason:
        persistedFollowups.length > 0
          ? undefined
          : "Aucune relance en base, planning calcule a la volee depuis la situation cible.",
    };
  } catch {
    return {
      situation: undefined,
      followups: [],
      dataOrigin: "supabase",
      persistenceMode: "generated",
      fallbackReason: "Lecture Supabase impossible pour le module relances.",
    };
  }
}
