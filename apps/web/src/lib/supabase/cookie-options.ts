import type { CookieOptionsWithName } from "@supabase/ssr";

// Toute l'authentification passe par le serveur : le cookie de session
// n'a pas besoin d'etre lisible en JavaScript.
export function getSupabaseCookieOptions(
  nodeEnv = process.env.NODE_ENV,
): CookieOptionsWithName {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: nodeEnv === "production",
  };
}
