"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

/**
 * Émet un acte de lancement (AE/OS/Notification du marché...) comme un Document ordinaire
 * (cycle BROUILLON → EN_VALIDATION → VALIDE → ENVOYE inchangé). Deux garde-fous :
 * 1. Rôle : seule une organisation dont le mission_role sur ce chantier correspond à celui
 *    attendu par le template peut émettre — vérification applicative explicite, pas une policy
 *    RLS (le rôle chantier n'est pas un axe d'isolation multi-tenant).
 * 2. Dépendance (checklist, pas un verrou silencieux) : si l'acte précédent requis n'est pas
 *    ENVOYE, l'émission exige un motif de déblocage tracé (voir log_act_override() côté base).
 */
export async function emitAct(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const siteId = String(formData.get("siteId") ?? "").trim();
  const actTemplateId = String(formData.get("actTemplateId") ?? "").trim();
  const overrideReason = String(formData.get("overrideReason") ?? "").trim();

  if (!organizationId || !siteId || !actTemplateId) {
    throw new Error("Organisation, chantier et acte sont obligatoires.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: template, error: templateError } = await supabase
    .from("act_templates")
    .select("*")
    .eq("id", actTemplateId)
    .single();
  if (templateError) throw templateError;

  const { data: participation } = await supabase
    .from("site_participants")
    .select("id")
    .eq("site_id", siteId)
    .eq("organization_id", organizationId)
    .eq("mission_role", template.required_mission_role)
    .maybeSingle();
  if (!participation) {
    throw new Error(
      `Seule une organisation avec le rôle "${template.required_mission_role}" sur ce chantier peut émettre cet acte.`
    );
  }

  if (template.depends_on_act_code) {
    const { data: dependency } = await supabase
      .from("documents")
      .select("id")
      .eq("site_id", siteId)
      .eq("act_code", template.depends_on_act_code)
      .eq("status", "ENVOYE")
      .maybeSingle();
    if (!dependency) {
      if (!overrideReason) {
        throw new Error(
          `L'acte "${template.depends_on_act_code}" doit être envoyé avant celui-ci. Indiquez un motif pour débloquer malgré tout.`
        );
      }
      const { error: overrideError } = await supabase.rpc("log_act_override", {
        p_organization_id: organizationId,
        p_site_id: siteId,
        p_act_code: template.code,
        p_reason: overrideReason,
      });
      if (overrideError) throw overrideError;
    }
  }

  const id = randomUUID();
  const { error } = await supabase.from("documents").insert({
    id,
    organization_id: organizationId,
    site_id: siteId,
    category: template.document_category,
    act_code: template.code,
    title: `${template.label} — ${new Date().toLocaleDateString("fr-FR")}`,
    status: "BROUILLON",
    file_url: `demo://documents/${id}.pdf`,
    created_by_user_id: user.id,
  });
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
}
