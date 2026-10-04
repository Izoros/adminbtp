import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { ensureBootstrapAdmin } from "@/modules/auth/services/admin-bootstrap";
import {
  buildLoginRedirectPath,
  mapAuthError,
  sanitizeRedirectPath,
} from "@/modules/auth/services/session-navigation";

const EMAIL_OTP_TYPES: EmailOtpType[] = [
  "email",
  "magiclink",
  "recovery",
  "invite",
  "signup",
  "email_change",
];

function noStoreRedirect(destination: URL) {
  const response = NextResponse.redirect(destination, { status: 303 });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

// Point de retour unique des emails Supabase : lien magique, invitation, reinitialisation.
// Gere le flux PKCE (?code=) et le flux token_hash (?token_hash=&type=).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const nextPath = sanitizeRedirectPath(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type") as EmailOtpType | null;
  const supabase = await createClient();

  const fail = (errorCode: Parameters<typeof buildLoginRedirectPath>[1]) =>
    noStoreRedirect(new URL(buildLoginRedirectPath(nextPath, errorCode), request.url));

  if (!supabase) {
    return fail("service_unavailable");
  }

  let result;

  if (code) {
    result = await supabase.auth.exchangeCodeForSession(code);
  } else if (tokenHash && otpType && EMAIL_OTP_TYPES.includes(otpType)) {
    result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType });
  } else {
    return fail("link_invalid");
  }

  if (result.error || !result.data.user) {
    const errorCode = result.error ? mapAuthError(result.error) : "link_invalid";
    return fail(errorCode === "unknown" ? "link_invalid" : errorCode);
  }

  await ensureBootstrapAdmin(result.data.user);

  const destination =
    otpType === "recovery" ? "/account/password" : nextPath;

  return noStoreRedirect(new URL(destination, request.url));
}
