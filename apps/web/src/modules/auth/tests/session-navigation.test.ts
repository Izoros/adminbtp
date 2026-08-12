import {
  buildLoginRedirectPath,
  getDefaultAuthRedirect,
  isLoginPath,
  isProtectedPath,
  sanitizeRedirectPath,
} from "@/modules/auth/services/session-navigation";

describe("navigation auth", () => {
  it("identifie les routes protegees de l'application", () => {
    expect(isProtectedPath("/admin")).toBe(true);
    expect(isProtectedPath("/admin/archives")).toBe(true);
    expect(isProtectedPath("/organizations")).toBe(true);
    expect(isProtectedPath("/projects/alpha")).toBe(true);
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/api/health")).toBe(false);
  });

  it("identifie correctement la page de login", () => {
    expect(isLoginPath("/login")).toBe(true);
    expect(isLoginPath("login")).toBe(true);
    expect(isLoginPath("/login/reset")).toBe(false);
  });

  it("refuse les redirections externes ou internes au tunnel auth", () => {
    expect(sanitizeRedirectPath(undefined)).toBe(getDefaultAuthRedirect());
    expect(sanitizeRedirectPath("https://evil.test")).toBe(
      getDefaultAuthRedirect(),
    );
    expect(sanitizeRedirectPath("//evil.test")).toBe(getDefaultAuthRedirect());
    expect(sanitizeRedirectPath("/login")).toBe(getDefaultAuthRedirect());
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
  });
});
