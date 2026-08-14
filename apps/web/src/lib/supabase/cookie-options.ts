import type { CookieOptionsWithName } from "@supabase/ssr";

export function getSupabaseCookieOptions(
  nodeEnv = process.env.NODE_ENV,
): CookieOptionsWithName {
  return {
    httpOnly: false,
    path: "/",
    sameSite: "lax",
    secure: nodeEnv === "production",
  };
}
