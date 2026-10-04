import { NextRequest } from "next/server";
import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: {
    exchangeCodeForSession: vi.fn(),
    verifyOtp: vi.fn(),
  },
  ensureBootstrapAdmin: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: mocks.auth })),
}));
vi.mock("@/modules/auth/services/admin-bootstrap", () => ({
  ensureBootstrapAdmin: mocks.ensureBootstrapAdmin,
}));

import { GET } from "@/app/auth/callback/route";

function call(query: string) {
  return GET(new NextRequest(`https://adminbtp.test/auth/callback?${query}`));
}

beforeEach(() => vi.clearAllMocks());

describe("GET /auth/callback", () => {
  it("echange le code PKCE puis redirige vers next", async () => {
    const user = { id: "u1", email: "a@b.fr" };
    mocks.auth.exchangeCodeForSession.mockResolvedValue({ data: { user }, error: null });

    const response = await call("code=abc&next=%2Fprojects");

    expect(mocks.auth.exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(mocks.ensureBootstrapAdmin).toHaveBeenCalledWith(user);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://adminbtp.test/projects");
  });

  it("verifie un token_hash de reinitialisation et ouvre la page mot de passe", async () => {
    mocks.auth.verifyOtp.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });

    const response = await call("token_hash=xyz&type=recovery");

    expect(mocks.auth.verifyOtp).toHaveBeenCalledWith({ token_hash: "xyz", type: "recovery" });
    expect(response.headers.get("location")).toBe("https://adminbtp.test/account/password");
  });

  it("renvoie vers /login avec un message si le lien est expire", async () => {
    mocks.auth.exchangeCodeForSession.mockResolvedValue({
      data: { user: null },
      error: { code: "otp_expired", status: 403 },
    });

    const response = await call("code=abc");

    expect(response.headers.get("location")).toBe(
      "https://adminbtp.test/login?error=link_invalid",
    );
  });

  it("refuse un lien incomplet ou une redirection externe", async () => {
    expect((await call("type=recovery")).headers.get("location")).toBe(
      "https://adminbtp.test/login?error=link_invalid",
    );

    mocks.auth.exchangeCodeForSession.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    expect((await call("code=abc&next=https://evil.test")).headers.get("location")).toBe(
      "https://adminbtp.test/admin",
    );
  });
});
