import {
  buildLoginRedirectPath,
  getDefaultAuthRedirect,
  getLoginErrorMessage,
  isLoginPath,
  isProtectedPath,
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
    expect(isProtectedPath("/login")).toBe(false);
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
    expect(sanitizeRedirectPath("/\\evil.test")).toBe(
      getDefaultAuthRedirect(),
    );
    expect(sanitizeRedirectPath("/\\\\evil.test/path")).toBe(
      getDefaultAuthRedirect(),
    );
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

  it("n'affiche que les erreurs de connexion repertoriees", () => {
    expect(getLoginErrorMessage("invalid_credentials")).toBe(
      "Identifiants invalides ou compte indisponible.",
    );
    expect(getLoginErrorMessage("Appelez un numero externe")).toBeNull();
  });
});
