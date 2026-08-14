import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const appDirectory = path.join(repositoryRoot, "apps/web/src/app");
const sourceDirectory = path.join(repositoryRoot, "apps/web/src");
const baseUrl = new URL(process.argv[2] ?? "http://127.0.0.1:3000");
const authenticatedAudit = process.argv.includes("--authenticated");
const sessionCookies = new Map();
const errorMarkers = [
  "<title>Application error",
  "<title>500: Internal Server Error",
  "<title>404: This page could not be found",
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(entryPath) : [entryPath];
    }),
  );

  return files.flat();
}

function normalizeRoute(filePath) {
  const relativeDirectory = path.relative(appDirectory, path.dirname(filePath));
  const segments = relativeDirectory
    .split(path.sep)
    .filter(Boolean)
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")));

  if (segments.some((segment) => segment.startsWith("[") || segment.startsWith("@"))) {
    return null;
  }

  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

function normalizeInternalTarget(target) {
  if (!target.startsWith("/") || target.startsWith("//")) {
    return null;
  }

  const url = new URL(target, baseUrl);
  return `${url.pathname}${url.search}`;
}

function extractStaticTargets(source) {
  const targets = new Set();
  const patterns = [
    /href\s*=\s*["']([^"']+)["']/g,
    /href\s*:\s*["']([^"']+)["']/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const target = normalizeInternalTarget(match[1]);
      if (target) targets.add(target);
    }
  }

  return targets;
}

function extractRenderedTargets(html) {
  const targets = new Set();

  for (const match of html.matchAll(/<a\b[^>]*\shref=["']([^"']+)["']/g)) {
    const target = normalizeInternalTarget(match[1].replaceAll("&amp;", "&"));
    if (target) targets.add(target);
  }

  return targets;
}

function readSetCookieHeaders(response) {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }

  const header = response.headers.get("set-cookie");
  return header ? [header] : [];
}

function storeResponseCookies(response) {
  for (const header of readSetCookieHeaders(response)) {
    const [nameValue, ...attributes] = header.split(";");
    const separator = nameValue.indexOf("=");

    if (separator <= 0) continue;

    const name = nameValue.slice(0, separator).trim();
    const value = nameValue.slice(separator + 1).trim();
    const deleted =
      value.length === 0 ||
      attributes.some((attribute) => /^\s*max-age=0\s*$/i.test(attribute));

    if (deleted) {
      sessionCookies.delete(name);
    } else {
      sessionCookies.set(name, value);
    }
  }
}

function buildCookieHeader() {
  return [...sessionCookies]
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

async function fetchFollowingRedirects(target, options = {}) {
  let currentUrl = new URL(target, baseUrl);
  let method = options.method ?? "GET";
  let body = options.body;
  const headers = new Headers(options.headers);

  for (let redirectCount = 0; redirectCount <= 10; redirectCount += 1) {
    const cookieHeader = buildCookieHeader();

    if (cookieHeader) {
      headers.set("cookie", cookieHeader);
    } else {
      headers.delete("cookie");
    }

    const response = await fetch(currentUrl, {
      body,
      headers,
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
    });
    storeResponseCookies(response);

    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return {
        redirected: redirectCount > 0,
        response,
      };
    }

    const location = response.headers.get("location");
    if (!location) {
      throw new Error(`${currentUrl.pathname}: redirection sans destination`);
    }

    currentUrl = new URL(location, currentUrl);

    if (currentUrl.origin !== baseUrl.origin) {
      throw new Error(
        `${currentUrl.pathname}: redirection externe inattendue vers ${currentUrl.origin}`,
      );
    }

    if (
      response.status === 303 ||
      ((response.status === 301 || response.status === 302) && method === "POST")
    ) {
      method = "GET";
      body = undefined;
      headers.delete("content-type");
    }
  }

  throw new Error(`${currentUrl.pathname}: trop de redirections`);
}

async function authenticateAuditSession() {
  const email = process.env.ADMINBTP_AUDIT_EMAIL;
  const password = process.env.ADMINBTP_AUDIT_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Audit authentifie: ADMINBTP_AUDIT_EMAIL et ADMINBTP_AUDIT_PASSWORD sont requis.",
    );
  }

  const response = await fetch(new URL("/auth/password-login", baseUrl), {
    method: "POST",
    body: new URLSearchParams({
      email,
      login_path: "/",
      next: "/admin",
      password,
    }),
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": "AdminBTP-Link-Audit/1.0",
    },
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
  });
  storeResponseCookies(response);

  if (response.status !== 200) {
    throw new Error(
      `Audit authentifie: la connexion doit confirmer la session en HTML, statut ${response.status}.`,
    );
  }

  if (!response.headers.get("content-type")?.includes("text/html")) {
    throw new Error("Audit authentifie: page de transition HTML absente.");
  }

  if (![...sessionCookies.keys()].some((name) => name.startsWith("sb-"))) {
    throw new Error("Audit authentifie: aucun cookie Supabase recu.");
  }

  const firstDashboard = await fetchFollowingRedirects("/admin", {
    headers: { "user-agent": "AdminBTP-Link-Audit/1.0" },
  });
  const firstDashboardPath = new URL(firstDashboard.response.url).pathname;

  if (!firstDashboard.response.ok || firstDashboardPath !== "/admin") {
    throw new Error(
      `Audit authentifie: ouverture du cockpit impossible (${firstDashboardPath}, HTTP ${firstDashboard.response.status}).`,
    );
  }

  const reloadedDashboard = await fetchFollowingRedirects("/admin", {
    headers: { "user-agent": "AdminBTP-Link-Audit/1.0" },
  });
  const reloadedDashboardPath = new URL(reloadedDashboard.response.url).pathname;

  if (!reloadedDashboard.response.ok || reloadedDashboardPath !== "/admin") {
    throw new Error(
      `Audit authentifie: session perdue au rechargement (${reloadedDashboardPath}, HTTP ${reloadedDashboard.response.status}).`,
    );
  }

  console.log("==> Connexion et rechargement authentifies OK");
}

async function fetchPage(target) {
  const result = await fetchFollowingRedirects(target, {
    headers: { "user-agent": "AdminBTP-Link-Audit/1.0" },
  });
  const { response } = result;
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`${target}: HTTP ${response.status}`);
  }

  if (!response.headers.get("content-type")?.includes("text/html")) {
    throw new Error(`${target}: content-type HTML absent`);
  }

  const marker = errorMarkers.find((candidate) => body.includes(candidate));
  if (marker) {
    throw new Error(`${target}: page d'erreur detectee (${marker})`);
  }

  if (body.replace(/<[^>]+>/g, " ").trim().length === 0) {
    throw new Error(`${target}: page vide`);
  }

  return {
    body,
    finalPath: new URL(response.url).pathname,
    redirected: result.redirected,
  };
}

const allAppFiles = await walk(appDirectory);
const pageRoutes = new Set(
  allAppFiles
    .filter((filePath) => filePath.endsWith(`${path.sep}page.tsx`))
    .map(normalizeRoute)
    .filter(Boolean),
);
const routeHandlerRoutes = new Set(
  allAppFiles
    .filter((filePath) => filePath.endsWith(`${path.sep}route.ts`))
    .map(normalizeRoute)
    .filter(Boolean),
);
const sourceFiles = (await walk(sourceDirectory)).filter(
  (filePath) => filePath.endsWith(".ts") || filePath.endsWith(".tsx"),
);
const sourceTargets = new Set();

for (const filePath of sourceFiles) {
  const source = await readFile(filePath, "utf8");
  for (const target of extractStaticTargets(source)) sourceTargets.add(target);
}

const knownRoutes = new Set([...pageRoutes, ...routeHandlerRoutes]);
const unresolvedTargets = [...sourceTargets].filter(
  (target) => !knownRoutes.has(new URL(target, baseUrl).pathname),
);

if (unresolvedTargets.length > 0) {
  throw new Error(`Liens internes sans route: ${unresolvedTargets.join(", ")}`);
}

if (authenticatedAudit) {
  await authenticateAuditSession();
}

const targetsToFetch = new Set(
  authenticatedAudit ? pageRoutes : [...pageRoutes, ...sourceTargets],
);
const renderedTargets = new Set();
let redirects = 0;

for (const target of [...targetsToFetch].sort()) {
  const result = await fetchPage(target);
  const requestedPath = new URL(target, baseUrl).pathname;

  if (
    authenticatedAudit &&
    !["/", "/login"].includes(requestedPath) &&
    result.finalPath !== requestedPath
  ) {
    throw new Error(
      `${target}: la page privee redirige vers ${result.finalPath} malgre la session active`,
    );
  }

  redirects += result.redirected ? 1 : 0;
  for (const renderedTarget of extractRenderedTargets(result.body)) {
    renderedTargets.add(renderedTarget);
  }
  console.log(
    `==> Lien OK ${target}${result.redirected ? ` -> ${result.finalPath}` : ""}`,
  );
}

const unknownRenderedTargets = [...renderedTargets].filter(
  (target) => !knownRoutes.has(new URL(target, baseUrl).pathname),
);

if (unknownRenderedTargets.length > 0) {
  throw new Error(
    `Liens rendus sans route connue: ${unknownRenderedTargets.join(", ")}`,
  );
}

console.log(
  `==> Audit liens${authenticatedAudit ? " authentifie" : ""} termine: ${pageRoutes.size} page(s), ${targetsToFetch.size} cible(s), ${redirects} redirection(s) logique(s).`,
);
