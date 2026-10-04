"use server";

import { redirect } from "next/navigation";

import { buildAuthCallbackUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import {
  ensureBootstrapAdmin,
  isBootstrapAdminEmail,
} from "@/modules/auth/services/admin-bootstrap";
import {
  type AuthErrorCode,
  authErrorMessages,
  mapAuthError,
  sanitizeRedirectPath,
} from "@/modules/auth/services/session-navigation";

export type AuthFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  email?: string;
};

const MIN_PASSWORD_LENGTH = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readEmail(formData: FormData) {
  return String(formData.get("email") ?? "").trim().toLowerCase();
}

function fail(code: AuthErrorCode, email?: string): AuthFormState {
  return { status: "error", message: authErrorMessages[code], email };
}

export async function signInWithPassword(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readEmail(formData);
  const password = String(formData.get("password") ?? "");
  const nextPath = sanitizeRedirectPath(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return fail("missing_fields", email);
  }

  if (!EMAIL_PATTERN.test(email)) {
    return fail("invalid_email", email);
  }

  const supabase = await createClient();

  if (!supabase) {
    return fail("service_unavailable", email);
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return fail(error ? mapAuthError(error) : "unknown", email);
  }

  await ensureBootstrapAdmin(data.user);
  redirect(nextPath);
}

export async function sendMagicLink(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readEmail(formData);
  const nextPath = sanitizeRedirectPath(String(formData.get("next") ?? ""));

  if (!EMAIL_PATTERN.test(email)) {
    return fail("invalid_email", email);
  }

  const supabase = await createClient();

  if (!supabase) {
    return fail("service_unavailable", email);
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Seuls les admins declares peuvent ouvrir un compte par lien ; les autres sont invites.
      shouldCreateUser: isBootstrapAdminEmail(email),
      emailRedirectTo: await buildAuthCallbackUrl(nextPath),
    },
  });

  if (error) {
    const code = mapAuthError(error);

    // Compte inconnu : meme reponse qu'en cas de succes pour ne pas reveler les comptes existants.
    if (code !== "service_unavailable" && code !== "rate_limited") {
      return magicLinkSent(email);
    }

    return fail(code, email);
  }

  return magicLinkSent(email);
}

function magicLinkSent(email: string): AuthFormState {
  return {
    status: "success",
    email,
    message:
      "Si un compte existe pour cette adresse, un lien de connexion vient d'etre envoye. Ouvrez-le dans ce navigateur.",
  };
}

export async function requestPasswordReset(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readEmail(formData);

  if (!EMAIL_PATTERN.test(email)) {
    return fail("invalid_email", email);
  }

  const supabase = await createClient();

  if (!supabase) {
    return fail("service_unavailable", email);
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: await buildAuthCallbackUrl("/account/password"),
  });

  if (error) {
    const code = mapAuthError(error);

    if (code === "service_unavailable" || code === "rate_limited") {
      return fail(code, email);
    }
  }

  return {
    status: "success",
    email,
    message:
      "Si un compte existe pour cette adresse, un email de reinitialisation vient d'etre envoye. Ouvrez le lien dans ce navigateur.",
  };
}

export async function updatePassword(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return fail("weak_password");
  }

  if (password !== confirmation) {
    return fail("password_mismatch");
  }

  const supabase = await createClient();

  if (!supabase) {
    return fail("service_unavailable");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("session_required");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return fail(mapAuthError(error));
  }

  redirect("/account/password?status=password_updated");
}

export async function signOut() {
  const supabase = await createClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/login?status=signed_out");
}
