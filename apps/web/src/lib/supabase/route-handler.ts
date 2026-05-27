import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { hasSupabaseConfig, publicEnv } from "@/lib/env";
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

export function copyAuthCookies(sourceResponse: NextResponse, targetResponse: NextResponse) {
  sourceResponse.cookies.getAll().forEach((cookie) => {
    targetResponse.cookies.set(cookie);
  });

  return targetResponse;
}
