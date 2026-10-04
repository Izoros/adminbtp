import "server-only";

import { headers } from "next/headers";

// Origine publique utilisee dans les liens envoyes par email.
// NEXT_PUBLIC_SITE_URL prime ; sinon on la deduit de la requete (Vercel, localhost).
export async function getSiteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    return new URL(configured).origin;
  }

  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${protocol}://${host}`;
}

export async function buildAuthCallbackUrl(nextPath: string) {
  const callbackUrl = new URL("/auth/callback", await getSiteOrigin());
  callbackUrl.searchParams.set("next", nextPath);
  return callbackUrl.toString();
}
