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

async function fetchPage(target) {
  const response = await fetch(new URL(target, baseUrl), {
    redirect: "follow",
    headers: { "user-agent": "AdminBTP-Link-Audit/1.0" },
    signal: AbortSignal.timeout(20_000),
  });
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
    redirected: response.redirected,
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

const targetsToFetch = new Set([...pageRoutes, ...sourceTargets]);
const renderedTargets = new Set();
let redirects = 0;

for (const target of [...targetsToFetch].sort()) {
  const result = await fetchPage(target);
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
  `==> Audit liens termine: ${pageRoutes.size} page(s), ${targetsToFetch.size} cible(s), ${redirects} redirection(s) logique(s).`,
);
