import { type NextRequest } from "next/server";

import {
  createAuthRedirect,
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
    return createAuthRedirect(new URL("/login", request.url));
  }

  const successResponse = createAuthRedirect(
    new URL(nextPath ?? getDefaultAuthRedirect(), request.url),
  );
  const { supabase, response } = createRouteHandlerClient(
    request,
    successResponse,
  );

  if (!supabase) {
    return createAuthRedirect(
      new URL(nextPath ?? getDefaultAuthRedirect(), request.url),
    );
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return createAuthRedirect(new URL("/login", request.url));
  }

  return response;
}
