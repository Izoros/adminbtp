import { getSupabaseCookieOptions } from "@/lib/supabase/cookie-options";

describe("Supabase cookie options", () => {
  it("securise le cookie de session en production", () => {
    const options = getSupabaseCookieOptions("production");

    expect(options).toMatchObject({
      httpOnly: false,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
    expect(options.partitioned).toBeUndefined();
  });

  it("autorise le developpement local en HTTP", () => {
    const options = getSupabaseCookieOptions("development");

    expect(options).toMatchObject({
      sameSite: "lax",
      secure: false,
    });
    expect(options.partitioned).toBeUndefined();
  });
});
