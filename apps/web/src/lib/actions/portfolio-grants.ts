"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * L'autorisation réelle reste portée par les policies RLS de portfolio_grants (voir
 * database/migrations/0006_multitenant_saas_rls.sql) : seul un ADMIN_PLATEFORME ou un
 * RESPONSABLE_PORTEFEUILLE peut attribuer, seul un ADMIN_PLATEFORME ou l'auteur du grant peut le
 * révoquer. Ces Server Actions ne font que relayer l'erreur Postgres telle quelle si la policy
 * refuse l'opération — aucune logique d'autorisation dupliquée ici.
 */
export async function grantPortfolioAccess(formData: FormData) {
  const userId = String(formData.get("userId") ?? "").trim();
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  if (!userId || !organizationId) {
    throw new Error("Collaborateur et organisation sont obligatoires.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { error: insertError } = await supabase.from("portfolio_grants").insert({
    user_id: userId,
    organization_id: organizationId,
    granted_by: user.id,
  });

  if (insertError) {
    // Contrainte unique (user_id, organization_id) : un grant déjà révoqué pour ce couple
    // existe toujours en base (jamais supprimé, voir migration 0001). On le réactive plutôt que
    // de dupliquer — bloqué par RLS si l'acteur n'est ni ADMIN_PLATEFORME ni l'auteur du grant
    // d'origine, auquel cas l'erreur Postgres est remontée telle quelle.
    if (insertError.code === "23505") {
      const { error: reactivateError } = await supabase
        .from("portfolio_grants")
        .update({
          granted_by: user.id,
          granted_at: new Date().toISOString(),
          revoked_at: null,
          revoked_by: null,
        })
        .eq("user_id", userId)
        .eq("organization_id", organizationId);
      if (reactivateError) throw reactivateError;
    } else {
      throw insertError;
    }
  }

  revalidatePath("/portefeuille");
}

export async function revokePortfolioAccess(formData: FormData) {
  const grantId = String(formData.get("grantId") ?? "").trim();
  if (!grantId) throw new Error("Grant manquant.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { error } = await supabase
    .from("portfolio_grants")
    .update({ revoked_at: new Date().toISOString(), revoked_by: user.id })
    .eq("id", grantId);
  if (error) throw error;

  revalidatePath("/portefeuille");
}
