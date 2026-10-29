import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";
import { getOrganizations } from "@/lib/data/organizations";
import { getActiveOrganizationIdCookie } from "@/lib/data/organization-context";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const [{ data: profile }, organizations, activeOrganizationId] = await Promise.all([
    supabase
      .from("users")
      .select("full_name, permission_role, organization_id, mfa_enabled")
      .eq("id", user.id)
      .single(),
    getOrganizations(),
    getActiveOrganizationIdCookie(),
  ]);

  return (
    <AppShell
      user={{
        email: user.email ?? "",
        fullName: profile?.full_name ?? user.email ?? "Utilisateur",
        permissionRole: profile?.permission_role ?? null,
        organizationId: profile?.organization_id ?? null,
        mfaEnabled: profile?.mfa_enabled ?? false,
      }}
      organizations={organizations}
      activeOrganizationId={activeOrganizationId}
    >
      {children}
    </AppShell>
  );
}
