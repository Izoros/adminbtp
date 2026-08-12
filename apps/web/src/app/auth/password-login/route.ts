import { type NextRequest, NextResponse } from "next/server";

import { hasSupabaseConfig } from "@/lib/env";
import {
  copyAuthCookies,
  createRouteHandlerClient,
} from "@/lib/supabase/route-handler";
import {
  getDefaultAuthRedirect,
  type LoginErrorCode,
  sanitizeRedirectPath,
} from "@/modules/auth/services/session-navigation";

function buildLoginErrorRedirect(
  request: NextRequest,
  nextPath: string,
  errorCode: LoginErrorCode,
  loginPath: "/" | "/login",
) {
  const redirectUrl = new URL(loginPath, request.url);
  redirectUrl.searchParams.set("errorCode", errorCode);

  if (nextPath !== getDefaultAuthRedirect()) {
    redirectUrl.searchParams.set("next", nextPath);
  }

  return redirectUrl;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextPath = sanitizeRedirectPath(String(formData.get("next") ?? ""));
  const loginPath = formData.get("login_path") === "/" ? "/" : "/login";

  if (!hasSupabaseConfig()) {
    return NextResponse.redirect(
      buildLoginErrorRedirect(
        request,
        nextPath,
        "configuration_unavailable",
        loginPath,
      ),
    );
  }

  if (!email || !password.trim()) {
    return NextResponse.redirect(
      buildLoginErrorRedirect(
        request,
        nextPath,
        "missing_credentials",
        loginPath,
      ),
    );
  }

  const { supabase, response } = createRouteHandlerClient(request);

  if (!supabase) {
    return NextResponse.redirect(
      buildLoginErrorRedirect(
        request,
        nextPath,
        "configuration_unavailable",
        loginPath,
      ),
    );
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.redirect(
      buildLoginErrorRedirect(
        request,
        nextPath,
        "invalid_credentials",
        loginPath,
      ),
    );
  }

  return copyAuthCookies(
    response,
    NextResponse.redirect(new URL(nextPath ?? getDefaultAuthRedirect(), request.url)),
  );
}
