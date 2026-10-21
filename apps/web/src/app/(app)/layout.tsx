import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, permission_role, organization_id")
    .eq("id", user.id)
    .single();

  return (
    <AppShell
      user={{
        email: user.email ?? "",
        fullName: profile?.full_name ?? user.email ?? "Utilisateur",
        permissionRole: profile?.permission_role ?? null,
        organizationId: profile?.organization_id ?? null,
      }}
    >
      {children}
    </AppShell>
  );
}
