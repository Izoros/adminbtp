import { getSupabaseCookieOptions } from "@/lib/supabase/cookie-options";

describe("Supabase cookie options", () => {
  it("securise le cookie de session en production", () => {
    expect(getSupabaseCookieOptions("production")).toMatchObject({
      httpOnly: false,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });

  it("autorise le developpement local en HTTP", () => {
    expect(getSupabaseCookieOptions("development").secure).toBe(false);
  });
});
