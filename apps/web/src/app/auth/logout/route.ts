import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

async function handleLogout(request: NextRequest) {
  const supabase = await createClient();

  if (supabase) {
    // On invalide la session distante et les cookies SSR associes.
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}
