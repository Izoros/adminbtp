const DEFAULT_AUTH_REDIRECT = "/admin";

const PROTECTED_PATH_PREFIXES = [
  "/admin",
  "/organizations",
  "/projects",
  "/opc",
  "/phases",
  "/client-space",
  "/consulting",
  "/documents",
  "/signatures",
  "/emails",
  "/followups",
  "/ai",
  "/n8n",
  "/odoo",
];

const AUTH_INTERNAL_PATH_PREFIXES = ["/login", "/auth"];
const REDIRECT_VALIDATION_ORIGIN = "https://adminbtp.local";

export const loginErrorMessages = {
  configuration_unavailable:
    "Configuration Supabase indisponible pour cette instance.",
  authentication_unavailable:
    "Le service de connexion est temporairement indisponible. Votre mot de passe n'est pas en cause.",
  missing_credentials: "Email et mot de passe obligatoires.",
  invalid_credentials: "Identifiants invalides ou compte indisponible.",
} as const;

export type LoginErrorCode = keyof typeof loginErrorMessages;

export function isAuthenticationUnavailable(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    message?: unknown;
    name?: unknown;
    status?: unknown;
  };
  const name = typeof candidate.name === "string" ? candidate.name : "";
  const message =
    typeof candidate.message === "string" ? candidate.message : "";

  return (
    name === "AuthRetryableFetchError" ||
    candidate.status === 0 ||
    /fetch failed|failed to fetch|network error/i.test(message)
  );
}

function normalizePathname(pathname: string) {
  if (!pathname.startsWith("/")) {
    return `/${pathname}`;
  }

  return pathname;
}

export function getDefaultAuthRedirect() {
  return DEFAULT_AUTH_REDIRECT;
}

export function getLoginErrorMessage(
  value: string | null | undefined,
): string | null {
  if (!value || !(value in loginErrorMessages)) {
    return null;
  }

  return loginErrorMessages[value as LoginErrorCode];
}

export function isProtectedPath(pathname: string) {
  const normalizedPathname = normalizePathname(pathname);

  return PROTECTED_PATH_PREFIXES.some(
    (protectedPath) =>
      normalizedPathname === protectedPath ||
      normalizedPathname.startsWith(`${protectedPath}/`),
  );
}

export function isLoginPath(pathname: string) {
  return normalizePathname(pathname) === "/login";
}

export function isAuthInternalPath(pathname: string) {
  const normalizedPathname = normalizePathname(pathname);

  return AUTH_INTERNAL_PATH_PREFIXES.some(
    (authPath) =>
      normalizedPathname === authPath ||
      normalizedPathname.startsWith(`${authPath}/`),
  );
}

export function sanitizeRedirectPath(path: string | null | undefined) {
  if (!path) {
    return DEFAULT_AUTH_REDIRECT;
  }

  let candidate: URL;

  try {
    candidate = new URL(path, REDIRECT_VALIDATION_ORIGIN);
  } catch {
    return DEFAULT_AUTH_REDIRECT;
  }

  if (candidate.origin !== REDIRECT_VALIDATION_ORIGIN) {
    return DEFAULT_AUTH_REDIRECT;
  }

  if (isAuthInternalPath(candidate.pathname)) {
    return DEFAULT_AUTH_REDIRECT;
  }

  return `${candidate.pathname}${candidate.search}`;
}

export function buildLoginRedirectPath(path: string) {
  const nextPath = sanitizeRedirectPath(path);

  if (nextPath === DEFAULT_AUTH_REDIRECT) {
    return "/login";
  }

  return `/login?next=${encodeURIComponent(nextPath)}`;
}
