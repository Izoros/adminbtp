import {
  buildLoginRedirectPath,
  getDefaultAuthRedirect,
  getAuthErrorMessage,
  getAuthStatusMessage,
  isAuthenticationUnavailable,
  isGuestOnlyPath,
  isProtectedPath,
  mapAuthError,
  sanitizeRedirectPath,
} from "@/modules/auth/services/session-navigation";
import { appNavigation } from "@/config/navigation";

describe("navigation auth", () => {
  it("identifie les routes protegees de l'application", () => {
    expect(isProtectedPath("/admin")).toBe(true);
    expect(isProtectedPath("/admin/archives")).toBe(true);
    expect(isProtectedPath("/organizations")).toBe(true);
    expect(isProtectedPath("/projects/alpha")).toBe(true);
    expect(isProtectedPath("/opc")).toBe(true);
    expect(isProtectedPath("/opc/export")).toBe(true);
    expect(isProtectedPath("/phases")).toBe(true);
    expect(isProtectedPath("/account/password")).toBe(true);
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/forgot-password")).toBe(false);
    expect(isProtectedPath("/api/health")).toBe(false);
  });

  it("protege toutes les destinations metier du menu", () => {
    const publicNavigationPaths = new Set(["/guide"]);
    const privateNavigationPaths = appNavigation
      .flatMap((section) => section.items)
      .map((item) => item.href)
      .filter((href) => !publicNavigationPaths.has(href));

    expect(privateNavigationPaths).not.toHaveLength(0);
    expect(privateNavigationPaths.every(isProtectedPath)).toBe(true);
  });

  it("identifie les pages reservees aux visiteurs", () => {
    expect(isGuestOnlyPath("/login")).toBe(true);
    expect(isGuestOnlyPath("login")).toBe(true);
    expect(isGuestOnlyPath("/forgot-password")).toBe(true);
    expect(isGuestOnlyPath("/account/password")).toBe(false);
  });

  it("refuse les redirections externes ou internes au tunnel auth", () => {
    expect(sanitizeRedirectPath(undefined)).toBe(getDefaultAuthRedirect());
    expect(sanitizeRedirectPath("https://evil.test")).toBe(
      getDefaultAuthRedirect(),
    );
    expect(sanitizeRedirectPath("//evil.test")).toBe(getDefaultAuthRedirect());
    expect(sanitizeRedirectPath("/\\evil.test")).toBe(
      getDefaultAuthRedirect(),
    );
    expect(sanitizeRedirectPath("/\\\\evil.test/path")).toBe(
      getDefaultAuthRedirect(),
    );
    expect(sanitizeRedirectPath("/login")).toBe(getDefaultAuthRedirect());
    expect(sanitizeRedirectPath("/forgot-password")).toBe(getDefaultAuthRedirect());
    expect(sanitizeRedirectPath("/auth/callback")).toBe(
      getDefaultAuthRedirect(),
    );
  });

  it("preserve une redirection relative valide", () => {
    expect(sanitizeRedirectPath("/projects?tab=actifs")).toBe(
      "/projects?tab=actifs",
    );
  });

  it("construit une redirection login avec next uniquement si necessaire", () => {
    expect(buildLoginRedirectPath("/projects")).toBe(
      "/login?next=%2Fprojects",
    );
    expect(buildLoginRedirectPath("/login")).toBe("/login");
    expect(buildLoginRedirectPath("/admin", "session_required")).toBe(
      "/login?error=session_required",
    );
  });

  it("n'affiche que les messages repertories", () => {
    expect(getAuthErrorMessage("invalid_credentials")).toBe(
      "Email ou mot de passe incorrect.",
    );
    expect(getAuthErrorMessage("Appelez un numero externe")).toBeNull();
    expect(getAuthErrorMessage("toString")).toBeNull();
    expect(getAuthStatusMessage("signed_out")).toBe("Vous etes deconnecte.");
  });

  it("traduit les erreurs Supabase en codes affichables", () => {
    expect(mapAuthError({ code: "invalid_credentials", status: 400 })).toBe(
      "invalid_credentials",
    );
    expect(mapAuthError({ code: "over_email_send_rate_limit", status: 429 })).toBe(
      "rate_limited",
    );
    expect(mapAuthError({ code: "otp_expired", status: 403 })).toBe("link_invalid");
    expect(mapAuthError({ name: "AuthRetryableFetchError", status: 0 })).toBe(
      "service_unavailable",
    );
    expect(mapAuthError({ code: "inconnu", status: 400 })).toBe("unknown");
  });

  it("distingue une indisponibilite reseau des identifiants invalides", () => {
    expect(
      isAuthenticationUnavailable({
        message: "fetch failed",
        name: "AuthRetryableFetchError",
        status: 0,
      }),
    ).toBe(true);
    expect(
      isAuthenticationUnavailable({
        message: "Invalid login credentials",
        name: "AuthApiError",
        status: 400,
      }),
    ).toBe(false);
  });
});
