import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Garde de périmètre : seul ADMIN_PLATEFORME ("Super Administrateur") accède à /admin. La
 * protection réelle reste côté base (RLS + vérification explicite dans chaque fonction SQL
 * SECURITY DEFINER) — cette garde évite seulement d'exposer l'interface à qui n'en a pas besoin.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("users")
    .select("permission_role")
    .eq("id", user.id)
    .single();

  if (profile?.permission_role !== "ADMIN_PLATEFORME") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
