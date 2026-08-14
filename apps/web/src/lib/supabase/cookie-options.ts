import type { CookieOptionsWithName } from "@supabase/ssr";

export function getSupabaseCookieOptions(
  nodeEnv = process.env.NODE_ENV,
): CookieOptionsWithName {
  const isProduction = nodeEnv === "production";

  return {
    httpOnly: false,
    partitioned: isProduction,
    path: "/",
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
  };
}
