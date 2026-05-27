import { type NextRequest, NextResponse } from "next/server";

import {
  copyAuthCookies,
  createRouteHandlerClient,
} from "@/lib/supabase/route-handler";

async function handleLogout(request: NextRequest) {
  const { supabase, response } = createRouteHandlerClient(request);

  if (supabase) {
    // On invalide la session distante et les cookies SSR associes.
    await supabase.auth.signOut();
  }

  return copyAuthCookies(response, NextResponse.redirect(new URL("/login", request.url)));
}

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}
