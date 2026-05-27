import { type NextRequest, NextResponse } from "next/server";

import {
  copyAuthCookies,
  createRouteHandlerClient,
} from "@/lib/supabase/route-handler";
import {
  getDefaultAuthRedirect,
  sanitizeRedirectPath,
} from "@/modules/auth/services/session-navigation";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = sanitizeRedirectPath(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { supabase, response } = createRouteHandlerClient(request);

  if (!supabase) {
    return NextResponse.redirect(
      new URL(nextPath ?? getDefaultAuthRedirect(), request.url),
    );
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return copyAuthCookies(
    response,
    NextResponse.redirect(
      new URL(nextPath ?? getDefaultAuthRedirect(), request.url),
    ),
  );
}
