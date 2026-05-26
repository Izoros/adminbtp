import { type NextRequest, NextResponse } from "next/server";

import {
  getDefaultAuthRedirect,
  sanitizeRedirectPath,
} from "@/modules/auth/services/session-navigation";
import {
  getTestAccessCookieName,
  getTestAccessCookieOptions,
  getTestAccessCookieValue,
  isTestAccessEnabled,
} from "@/modules/auth/services/test-access";

function buildRedirectResponse(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const nextPath = sanitizeRedirectPath(requestUrl.searchParams.get("next"));
  const response = NextResponse.redirect(
    new URL(nextPath ?? getDefaultAuthRedirect(), request.url),
  );

  response.cookies.set(
    getTestAccessCookieName(),
    getTestAccessCookieValue(),
    getTestAccessCookieOptions(),
  );

  return response;
}

export async function GET(request: NextRequest) {
  if (!isTestAccessEnabled()) {
    return NextResponse.redirect(new URL("/login?testAccess=disabled", request.url));
  }

  return buildRedirectResponse(request);
}

export async function POST(request: NextRequest) {
  if (!isTestAccessEnabled()) {
    return NextResponse.redirect(new URL("/login?testAccess=disabled", request.url));
  }

  return buildRedirectResponse(request);
}
