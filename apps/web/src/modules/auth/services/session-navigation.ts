const DEFAULT_AUTH_REDIRECT = "/admin";

const PROTECTED_PATH_PREFIXES = [
  "/admin",
  "/account",
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

// Pages reservees aux visiteurs non connectes : une session active les quitte.
const GUEST_ONLY_PATHS = ["/login", "/forgot-password"];

// Jamais utilisees comme destination apres connexion.
const AUTH_INTERNAL_PATH_PREFIXES = ["/login", "/forgot-password", "/auth"];

const REDIRECT_VALIDATION_ORIGIN = "https://adminbtp.local";

export const authErrorMessages = {
  service_unavailable:
    "Le service de connexion est momentanement indisponible. Reessayez dans quelques minutes.",
  missing_fields: "Renseignez votre email et votre mot de passe.",
  invalid_email: "Adresse email invalide.",
  invalid_credentials: "Email ou mot de passe incorrect.",
  email_not_confirmed:
    "Votre email n'est pas encore confirme. Utilisez le lien de connexion pour l'activer.",
  rate_limited: "Trop de tentatives. Patientez quelques minutes avant de reessayer.",
  link_invalid:
    "Ce lien est invalide ou expire. Demandez-en un nouveau, depuis le meme navigateur.",
  weak_password: "Mot de passe trop faible : 10 caracteres minimum.",
  password_mismatch: "Les deux mots de passe ne correspondent pas.",
  same_password: "Choisissez un mot de passe different de l'actuel.",
  session_required: "Votre session a expire. Reconnectez-vous.",
  unknown: "La connexion a echoue. Reessayez.",
} as const;

export type AuthErrorCode = keyof typeof authErrorMessages;

export const authStatusMessages = {
  signed_out: "Vous etes deconnecte.",
  password_updated: "Mot de passe enregistre. Vous pouvez l'utiliser pour vous connecter.",
} as const;

export type AuthStatusCode = keyof typeof authStatusMessages;

export function getAuthErrorMessage(value: string | null | undefined) {
  if (!value || !Object.hasOwn(authErrorMessages, value)) {
    return null;
  }

  return authErrorMessages[value as AuthErrorCode];
}

export function getAuthStatusMessage(value: string | null | undefined) {
  if (!value || !Object.hasOwn(authStatusMessages, value)) {
    return null;
  }

  return authStatusMessages[value as AuthStatusCode];
}

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
    (typeof candidate.status === "number" && candidate.status >= 500) ||
    /fetch failed|failed to fetch|network error/i.test(message)
  );
}

// Traduit une erreur Supabase Auth en code affichable, sans exposer le detail technique.
export function mapAuthError(error: unknown): AuthErrorCode {
  if (isAuthenticationUnavailable(error)) {
    return "service_unavailable";
  }

  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  switch (code) {
    case "invalid_credentials":
      return "invalid_credentials";
    case "email_not_confirmed":
      return "email_not_confirmed";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rate_limited";
    case "weak_password":
      return "weak_password";
    case "same_password":
      return "same_password";
    case "otp_expired":
    case "flow_state_expired":
    case "flow_state_not_found":
    case "bad_code_verifier":
      return "link_invalid";
    case "session_not_found":
    case "session_expired":
    case "refresh_token_not_found":
      return "session_required";
    default:
      return "unknown";
  }
}

function normalizePathname(pathname: string) {
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function matchesPrefix(pathname: string, prefixes: string[]) {
  const normalizedPathname = normalizePathname(pathname);

  return prefixes.some(
    (prefix) =>
      normalizedPathname === prefix || normalizedPathname.startsWith(`${prefix}/`),
  );
}

export function getDefaultAuthRedirect() {
  return DEFAULT_AUTH_REDIRECT;
}

export function isProtectedPath(pathname: string) {
  return matchesPrefix(pathname, PROTECTED_PATH_PREFIXES);
}

export function isGuestOnlyPath(pathname: string) {
  return GUEST_ONLY_PATHS.includes(normalizePathname(pathname));
}

export function isAuthInternalPath(pathname: string) {
  return matchesPrefix(pathname, AUTH_INTERNAL_PATH_PREFIXES);
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

export function buildLoginRedirectPath(
  path: string,
  errorCode?: AuthErrorCode,
) {
  const nextPath = sanitizeRedirectPath(path);
  const params = new URLSearchParams();

  if (nextPath !== DEFAULT_AUTH_REDIRECT) {
    params.set("next", nextPath);
  }

  if (errorCode) {
    params.set("error", errorCode);
  }

  return params.size > 0 ? `/login?${params.toString()}` : "/login";
}
