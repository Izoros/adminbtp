const DEFAULT_AUTH_REDIRECT = "/organizations";

const PROTECTED_PATH_PREFIXES = [
  "/admin",
  "/organizations",
  "/projects",
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

function normalizePathname(pathname: string) {
  if (!pathname.startsWith("/")) {
    return `/${pathname}`;
  }

  return pathname;
}

export function getDefaultAuthRedirect() {
  return DEFAULT_AUTH_REDIRECT;
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

  if (!path.startsWith("/")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  if (path.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  const [pathname] = path.split("?");

  if (isAuthInternalPath(pathname ?? path)) {
    return DEFAULT_AUTH_REDIRECT;
  }

  return path;
}

export function buildLoginRedirectPath(path: string) {
  const nextPath = sanitizeRedirectPath(path);

  if (nextPath === DEFAULT_AUTH_REDIRECT) {
    return "/login";
  }

  return `/login?next=${encodeURIComponent(nextPath)}`;
}
