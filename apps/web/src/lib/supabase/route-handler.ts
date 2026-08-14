import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { hasSupabaseConfig, publicEnv } from "@/lib/env";
import { getSupabaseCookieOptions } from "@/lib/supabase/cookie-options";
import type { SupabaseDatabase } from "@/types/supabase";

export function createRouteHandlerClient(
  request: NextRequest,
  response: NextResponse = NextResponse.next({ request }),
) {
  if (!hasSupabaseConfig()) {
    return {
      supabase: null,
      response,
    };
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
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
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

  return {
    supabase,
    response,
  };
}

export function createAuthRedirect(destination: string | URL) {
  const response = NextResponse.redirect(destination, { status: 303 });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

export function createAuthTransitionResponse(destination: URL) {
  const safeDestination = escapeHtmlAttribute(destination.toString());
  const response = new NextResponse(
    `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="referrer" content="no-referrer">
    <meta http-equiv="refresh" content="1;url=${safeDestination}">
    <title>Connexion AdminBTP</title>
  </head>
  <body>
    <p>Connexion validee. <a href="${safeDestination}">Ouvrir AdminBTP</a></p>
  </body>
</html>`,
    {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Type": "text/html; charset=utf-8",
      },
    },
  );

  return response;
}

function escapeHtmlAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
