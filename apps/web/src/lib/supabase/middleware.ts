import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@adminbtp/types";

/**
 * Rafraîchit la session Supabase à chaque requête et protège les routes sous (app) —
 * redirige vers / si non authentifié. Appelé depuis middleware.ts à la racine.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = request.nextUrl.pathname === "/";

  if (!user && !isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl);
  }

  // Si l'utilisateur a un facteur MFA vérifié (TOTP via Supabase Auth), une session mot de
  // passe seul reste au niveau aal1 — tant que le step-up aal2 n'est pas complété, elle ne doit
  // donner accès à aucune route protégée, seulement à "/" où le formulaire de connexion affiche
  // l'étape de code à 6 chiffres. getAuthenticatorAssuranceLevel() décode le JWT déjà en
  // mémoire/cookies, sans appel réseau supplémentaire.
  let requiresMfaStepUp = false;
  if (user) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    requiresMfaStepUp = Boolean(
      aal && aal.nextLevel === "aal2" && aal.currentLevel !== aal.nextLevel
    );
  }

  if (user && requiresMfaStepUp && !isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && !requiresMfaStepUp && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
