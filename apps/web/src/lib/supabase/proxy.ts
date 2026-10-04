import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { hasSupabaseConfig, publicEnv } from "@/lib/env";
import { getSupabaseCookieOptions } from "@/lib/supabase/cookie-options";
import {
  buildLoginRedirectPath,
  isAuthenticationUnavailable,
  isGuestOnlyPath,
  isProtectedPath,
  sanitizeRedirectPath,
} from "@/modules/auth/services/session-navigation";
import type { SupabaseDatabase } from "@/types/supabase";

// Rafraichit la session Supabase et applique les deux regles d'acces :
// page protegee sans session -> /login ; page visiteur avec session -> application.
export async function updateSession(
  request: NextRequest,
  forwardedHeaders: Headers = request.headers,
) {
  const { pathname, search } = request.nextUrl;
  let response = NextResponse.next({ request: { headers: forwardedHeaders } });

  if (!hasSupabaseConfig()) {
    return isProtectedPath(pathname)
      ? redirectTo(request, response, buildLoginRedirectPath(pathname, "service_unavailable"))
      : response;
  }

  const supabase = createServerClient<SupabaseDatabase>(
    publicEnv.supabaseUrl!,
    publicEnv.supabasePublishableKey!,
    {
      cookieOptions: getSupabaseCookieOptions(),
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: forwardedHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // getUser revalide le jeton aupres de Supabase : ne pas remplacer par getSession.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(pathname)) {
    return redirectTo(
      request,
      response,
      buildLoginRedirectPath(
        `${pathname}${search}`,
        isAuthenticationUnavailable(error) ? "service_unavailable" : undefined,
      ),
    );
  }

  if (user && isGuestOnlyPath(pathname)) {
    return redirectTo(
      request,
      response,
      sanitizeRedirectPath(request.nextUrl.searchParams.get("next")),
    );
  }

  return response;
}

function redirectTo(request: NextRequest, sourceResponse: NextResponse, path: string) {
  const redirectResponse = NextResponse.redirect(new URL(path, request.url));

  // Conserve les cookies de session rafraichis pendant la verification.
  sourceResponse.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  redirectResponse.headers.set("Cache-Control", "private, no-store, max-age=0");

  return redirectResponse;
}
