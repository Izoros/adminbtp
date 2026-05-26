import { type NextRequest, NextResponse } from "next/server";

import { getTestAccessCookieName } from "@/modules/auth/services/test-access";

function buildResponse(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(getTestAccessCookieName());
  return response;
}

export async function GET(request: NextRequest) {
  return buildResponse(request);
}

export async function POST(request: NextRequest) {
  return buildResponse(request);
}
