import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { hasSupabaseConfig, publicEnv } from "@/lib/env";
import { getSupabaseCookieOptions } from "@/lib/supabase/cookie-options";
import {
  buildLoginRedirectPath,
  getDefaultAuthRedirect,
  isLoginPath,
  isProtectedPath,
  sanitizeRedirectPath,
} from "@/modules/auth/services/session-navigation";
import type { SupabaseDatabase } from "@/types/supabase";

export async function updateSession(
  request: NextRequest,
  forwardedHeaders: Headers = request.headers,
) {
  const requestUrl = new URL(request.url);
  let response = NextResponse.next({
    request: {
      headers: forwardedHeaders,
    },
  });

  if (!hasSupabaseConfig() || !shouldHandleAuthGuard(requestUrl.pathname)) {
    return response;
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

          response = NextResponse.next({
            request: {
              headers: forwardedHeaders,
            },
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    },
  );

  // On revalide l'identite cote serveur avant toute decision de redirection.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(requestUrl.pathname)) {
    return createRedirectResponse(
      response,
      new URL(
        buildLoginRedirectPath(
          `${requestUrl.pathname}${requestUrl.search}${requestUrl.hash}`,
        ),
        request.url,
      ),
    );
  }

  if (!user && isLoginPath(requestUrl.pathname)) {
    const publicLoginUrl = new URL("/", request.url);
    const nextPath = sanitizeRedirectPath(requestUrl.searchParams.get("next"));
    const errorCode = requestUrl.searchParams.get("errorCode");

    if (nextPath !== getDefaultAuthRedirect()) {
      publicLoginUrl.searchParams.set("next", nextPath);
    }

    if (errorCode) {
      publicLoginUrl.searchParams.set("errorCode", errorCode);
    }

    publicLoginUrl.hash = "connexion";

    return createRedirectResponse(response, publicLoginUrl);
  }

  if (user && isLoginPath(requestUrl.pathname)) {
    const nextPath = requestUrl.searchParams.get("next");

    return createRedirectResponse(
      response,
      new URL(
        nextPath ? sanitizeRedirectPath(nextPath) : getDefaultAuthRedirect(),
        request.url,
      ),
    );
  }

  return response;
}

function shouldHandleAuthGuard(pathname: string) {
  return isProtectedPath(pathname) || isLoginPath(pathname);
}

function createRedirectResponse(
  sourceResponse: NextResponse,
  destination: URL,
) {
  const redirectResponse = NextResponse.redirect(destination);

  sourceResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}
