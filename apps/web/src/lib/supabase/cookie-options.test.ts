import { getSupabaseCookieOptions } from "@/lib/supabase/cookie-options";

describe("Supabase cookie options", () => {
  it("securise le cookie de session en production", () => {
    expect(getSupabaseCookieOptions("production")).toMatchObject({
      httpOnly: false,
      partitioned: true,
      path: "/",
      sameSite: "none",
      secure: true,
    });
  });

  it("autorise le developpement local en HTTP", () => {
    expect(getSupabaseCookieOptions("development")).toMatchObject({
      partitioned: false,
      sameSite: "lax",
      secure: false,
    });
  });
});
