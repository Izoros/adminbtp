import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type {
  IntegrationReadinessAccessResult,
  IntegrationReadinessCheck,
  IntegrationReadinessData,
  IntegrationReadinessGroup,
} from "@/modules/settings/types/integration-readiness";
import type { SupabaseDatabase } from "@/types/supabase";

type EnvironmentValues = Record<string, string | undefined>;

function hasValue(environment: EnvironmentValues, name: string) {
  return Boolean(environment[name]?.trim());
}

function isEnabled(environment: EnvironmentValues, name: string) {
  return environment[name]?.trim().toLowerCase() === "true";
}

function countCsvValues(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function check(label: string, ready: boolean, readyDetail: string): IntegrationReadinessCheck {
  return {
    label,
    ready,
    detail: ready ? readyDetail : "Configuration manquante",
  };
}

function buildGroup(
  input: Omit<IntegrationReadinessGroup, "status" | "statusLabel"> & {
    enabled?: boolean;
  },
): IntegrationReadinessGroup {
  const ready = input.checks.every((item) => item.ready);
  const status = ready ? "ready" : input.enabled === false ? "inactive" : "attention";

  return {
    id: input.id,
    title: input.title,
    description: input.description,
    checks: input.checks,
    status,
    statusLabel:
      status === "ready"
        ? "Pret a tester"
        : status === "inactive"
          ? "Desactive"
          : "Configuration incomplete",
  };
}

export function buildIntegrationReadinessData(
  environment: EnvironmentValues,
  now = new Date(),
): IntegrationReadinessData {
  const hasPublicSupabaseKey =
    hasValue(environment, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ||
    hasValue(environment, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const whatsappEnabled = isEnabled(
    environment,
    "ADMINBTP_WHATSAPP_COMMANDS_ENABLED",
  );
  const archiveEnabled = isEnabled(environment, "MARKET_ARCHIVE_ENABLED");
  const alertsEnabled = isEnabled(
    environment,
    "ADMINBTP_OPERATIONS_ALERTS_ENABLED",
  );
  const allowedSenders = countCsvValues(
    environment.ADMINBTP_WHATSAPP_ALLOWED_SENDERS,
  );
  const alertHosts = countCsvValues(
    environment.ADMINBTP_OPERATIONS_ALERT_ALLOWED_HOSTS,
  );
  const hasArchiveTarget =
    hasValue(environment, "MARKET_ARCHIVE_LOCAL_DIR") ||
    (hasValue(environment, "MARKET_ARCHIVE_SFTP_HOST") &&
      hasValue(environment, "MARKET_ARCHIVE_SFTP_USERNAME"));
  const hasAlertHttpsUrl = (() => {
    try {
      return (
        new URL(environment.ADMINBTP_OPERATIONS_ALERT_WEBHOOK_URL ?? "")
          .protocol === "https:"
      );
    } catch {
      return false;
    }
  })();

  const groups: IntegrationReadinessGroup[] = [
    buildGroup({
      id: "supabase",
      title: "Supabase",
      description:
        "Variables presentes uniquement. La joignabilite et les migrations distantes restent a verifier.",
      checks: [
        check(
          "URL du projet",
          hasValue(environment, "NEXT_PUBLIC_SUPABASE_URL"),
          "Variable presente",
        ),
        check("Cle publique", hasPublicSupabaseKey, "Variable presente"),
        check(
          "Cle service role",
          hasValue(environment, "SUPABASE_SERVICE_ROLE_KEY"),
          "Variable serveur presente",
        ),
      ],
    }),
    buildGroup({
      id: "whatsapp",
      title: "Commandes WhatsApp",
      description:
        "Transport Meta signe, liste blanche et file de revue humaine.",
      enabled: whatsappEnabled,
      checks: [
        check("Interrupteur", whatsappEnabled, "Active"),
        check(
          "Token de verification",
          hasValue(environment, "ADMINBTP_WHATSAPP_WEBHOOK_VERIFY_TOKEN"),
          "Variable serveur presente",
        ),
        check(
          "Secret application Meta",
          hasValue(environment, "ADMINBTP_WHATSAPP_APP_SECRET"),
          "Variable serveur presente",
        ),
        check(
          "Expediteurs autorises",
          allowedSenders > 0,
          `${allowedSenders} expediteur(s) configure(s)`,
        ),
      ],
    }),
    buildGroup({
      id: "archive",
      title: "Archives longue duree",
      description:
        "Archive quotidienne verifiee et stockage local ou SFTP externe.",
      enabled: archiveEnabled,
      checks: [
        check("Interrupteur", archiveEnabled, "Active"),
        check("Secret cron", hasValue(environment, "CRON_SECRET"), "Variable serveur presente"),
        check("Cible de stockage", hasArchiveTarget, "Cible configuree"),
      ],
    }),
    buildGroup({
      id: "alerts",
      title: "Alertes d'exploitation",
      description:
        "Outbox idempotente vers un webhook HTTPS explicitement autorise.",
      enabled: alertsEnabled,
      checks: [
        check("Interrupteur", alertsEnabled, "Active"),
        check("Destination HTTPS", hasAlertHttpsUrl, "URL HTTPS presente"),
        check(
          "Token sortant",
          hasValue(environment, "ADMINBTP_OPERATIONS_ALERT_WEBHOOK_TOKEN"),
          "Variable serveur presente",
        ),
        check(
          "Hotes autorises",
          alertHosts > 0,
          `${alertHosts} hote(s) configure(s)`,
        ),
      ],
    }),
  ];

  return {
    updatedAt: now.toISOString(),
    readyGroups: groups.filter((group) => group.status === "ready").length,
    totalGroups: groups.length,
    groups,
  };
}

async function isCurrentUserPlatformAdmin(
  supabase: SupabaseClient<SupabaseDatabase>,
) {
  const { data, error } = await supabase.rpc("is_platform_admin");
  return error ? null : data === true;
}

export async function loadIntegrationReadiness(): Promise<IntegrationReadinessAccessResult> {
  const supabase = await createClient();

  if (!supabase) {
    return {
      access: "unavailable",
      message: "Supabase est indisponible pour verifier l'acces plateforme.",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      access: "unauthenticated",
      message: "Une session Supabase est requise pour consulter cette preparation.",
    };
  }

  const platformAdmin = await isCurrentUserPlatformAdmin(supabase);

  if (platformAdmin === null) {
    return { access: "unavailable", message: "Le role plateforme n'a pas pu etre verifie." };
  }

  if (!platformAdmin) {
    return {
      access: "forbidden",
      message: "La preparation des integrations est reservee aux administrateurs plateforme.",
    };
  }

  return { access: "ready", data: buildIntegrationReadinessData(process.env) };
}
