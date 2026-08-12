import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  getDefaultAuthRedirect,
  sanitizeRedirectPath,
} from "@/modules/auth/services/session-navigation";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
    error?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextValue = Array.isArray(resolvedSearchParams?.next)
    ? resolvedSearchParams.next[0]
    : resolvedSearchParams?.next;
  const errorMessage = Array.isArray(resolvedSearchParams?.error)
    ? resolvedSearchParams.error[0]
    : resolvedSearchParams?.error;
  const nextPath = sanitizeRedirectPath(nextValue);
  const user = await getAuthenticatedUser();

  if (user) {
    redirect(nextPath || getDefaultAuthRedirect());
  }

  const params = new URLSearchParams();
  if (nextPath !== getDefaultAuthRedirect()) params.set("next", nextPath);
  if (errorMessage) params.set("error", errorMessage);

  redirect(`/${params.size ? `?${params.toString()}` : ""}#connexion`);
}
