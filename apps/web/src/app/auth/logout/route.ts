import { type NextRequest } from "next/server";

import {
  createAuthRedirect,
  createRouteHandlerClient,
} from "@/lib/supabase/route-handler";

async function handleLogout(request: NextRequest) {
  const logoutResponse = createAuthRedirect(new URL("/login", request.url));
  const { supabase, response } = createRouteHandlerClient(
    request,
    logoutResponse,
  );

  if (supabase) {
    // On invalide la session distante et les cookies SSR associes.
    await supabase.auth.signOut();
  }

  return response;
}

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}
