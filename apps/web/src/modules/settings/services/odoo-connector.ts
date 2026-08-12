import "server-only";

import { isIP } from "node:net";

import type { OdooConnectionReadiness } from "@/modules/settings/types/odoo";

type EnvironmentValues = Record<string, string | undefined>;
type OdooJson2Method = "search_read" | "create" | "write";
type OdooSupportedModel =
  | "res.partner"
  | "account.move"
  | "sale.subscription"
  | "product.product"
  | "hr.employee"
  | "hr.contract"
  | "hr.attendance"
  | "hr.leave"
  | "account.analytic.line"
  | "hr.payslip";

type OdooConnectionConfig =
  | { mode: "inactive"; reason: string }
  | { mode: "invalid"; reason: string }
  | {
      mode: "active";
      baseUrl: string;
      database: string;
      apiKey: string;
    };

function readValue(environment: EnvironmentValues, name: string) {
  const value = environment[name]?.trim();
  return value ? value : null;
}

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".").map(Number);
  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && (parts[1] ?? 0) >= 16 && (parts[1] ?? 0) <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

function isLocalOrPrivateHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  const ipVersion = isIP(normalized);
  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "::1"
  ) {
    return true;
  }
  if (ipVersion === 4) return isPrivateIpv4(normalized);
  return ipVersion === 6;
}

export function resolveOdooConnectionConfig(
  environment: EnvironmentValues = process.env,
): OdooConnectionConfig {
  if (readValue(environment, "ADMINBTP_ODOO_ENABLED") !== "true") {
    return { mode: "inactive", reason: "Connecteur Odoo desactive." };
  }

  const baseUrlValue = readValue(environment, "ADMINBTP_ODOO_BASE_URL");
  const database = readValue(environment, "ADMINBTP_ODOO_DATABASE");
  const apiKey = readValue(environment, "ADMINBTP_ODOO_API_KEY");
  const allowedHosts = new Set(
    (readValue(environment, "ADMINBTP_ODOO_ALLOWED_HOSTS") ?? "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  );

  if (!baseUrlValue || !database || !apiKey || allowedHosts.size === 0) {
    return {
      mode: "invalid",
      reason: "URL, base, cle API ou liste d'hotes Odoo manquante.",
    };
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(baseUrlValue);
  } catch {
    return { mode: "invalid", reason: "URL Odoo invalide." };
  }

  const hostname = baseUrl.hostname.toLowerCase();
  if (
    baseUrl.protocol !== "https:" ||
    baseUrl.username ||
    baseUrl.password ||
    isLocalOrPrivateHost(hostname) ||
    !allowedHosts.has(hostname)
  ) {
    return {
      mode: "invalid",
      reason: "L'instance Odoo doit etre HTTPS et explicitement autorisee.",
    };
  }

  return {
    mode: "active",
    baseUrl: baseUrl.origin,
    database,
    apiKey,
  };
}

export function buildOdooConnectionReadiness(
  environment: EnvironmentValues = process.env,
): OdooConnectionReadiness {
  const config = resolveOdooConnectionConfig(environment);
  const enabled = readValue(environment, "ADMINBTP_ODOO_ENABLED") === "true";
  const checks = [
    { label: "Interrupteur", ready: enabled, detail: enabled ? "Active" : "Desactive" },
    {
      label: "Destination HTTPS autorisee",
      ready: config.mode === "active",
      detail: config.mode === "active" ? "Configuree" : "Configuration manquante",
    },
    {
      label: "Base Odoo",
      ready: Boolean(readValue(environment, "ADMINBTP_ODOO_DATABASE")),
      detail: readValue(environment, "ADMINBTP_ODOO_DATABASE")
        ? "Variable presente"
        : "Configuration manquante",
    },
    {
      label: "Cle API serveur",
      ready: Boolean(readValue(environment, "ADMINBTP_ODOO_API_KEY")),
      detail: readValue(environment, "ADMINBTP_ODOO_API_KEY")
        ? "Variable serveur presente"
        : "Configuration manquante",
    },
  ];
  const status = config.mode === "active" ? "ready" : enabled ? "attention" : "inactive";

  return {
    status,
    statusLabel:
      status === "ready"
        ? "Pret a tester"
        : status === "inactive"
          ? "Desactive"
          : "Configuration incomplete",
    checks,
  };
}

export async function requestOdooJson2<T>(options: {
  model: OdooSupportedModel;
  method: OdooJson2Method;
  payload: Record<string, unknown>;
  environment?: EnvironmentValues;
  fetcher?: typeof fetch;
}): Promise<T> {
  const config = resolveOdooConnectionConfig(options.environment);
  if (config.mode !== "active") {
    throw new Error(config.reason);
  }

  const response = await (options.fetcher ?? fetch)(
    `${config.baseUrl}/json/2/${options.model}/${options.method}`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        "content-type": "application/json; charset=utf-8",
        "user-agent": "AdminBTP-Odoo-Connector/1.0",
        "x-odoo-database": config.database,
      },
      body: JSON.stringify(options.payload),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) {
    throw new Error(`Connexion Odoo refusee (HTTP ${response.status}).`);
  }

  return (await response.json()) as T;
}

export async function probeOdooConnection(options?: {
  environment?: EnvironmentValues;
  fetcher?: typeof fetch;
}) {
  await requestOdooJson2({
    model: "res.partner",
    method: "search_read",
    payload: { domain: [], fields: ["id"], limit: 1 },
    environment: options?.environment,
    fetcher: options?.fetcher,
  });

  return { ok: true as const };
}
