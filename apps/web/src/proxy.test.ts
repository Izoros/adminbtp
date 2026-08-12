import { buildContentSecurityPolicy } from "@/proxy";

describe("proxy security headers", () => {
  it("genere une CSP stricte en production", () => {
    const policy = buildContentSecurityPolicy("nonce-test", false);

    expect(policy).toContain("script-src 'self' 'nonce-nonce-test' 'strict-dynamic'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(policy).not.toContain("'unsafe-eval'");
  });

  it("reserve unsafe-eval au developpement React", () => {
    expect(buildContentSecurityPolicy("nonce-test", true)).toContain(
      "'unsafe-eval'",
    );
  });
});
