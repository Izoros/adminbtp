"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { IntegrationManagedBy, IntegrationType } from "@adminbtp/types";

/**
 * `config` ne doit contenir que des informations non sensibles (URL, identifiant d'instance) —
 * voir database/migrations/0005_multitenant_saas_requirements.sql. Le champ "Clé API" affiché
 * dans le formulaire (apps/web/src/app/(app)/parametres/page.tsx) n'est volontairement PAS lu ici
 * : un coffre-fort de secrets réel (chiffrement, rotation) est hors scope de cette tâche et sera
 * traité en Phase 7 — le persister en clair dans ce jsonb serait une régression de sécurité.
 */
export async function saveOrganizationIntegration(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const integrationType = String(formData.get("integrationType") ?? "").trim() as IntegrationType;
  const managedBy = String(formData.get("managedBy") ?? "ADMINBTP").trim() as IntegrationManagedBy;
  const isActive = formData.get("isActive") === "on";
  const url = String(formData.get("url") ?? "").trim();
  const instanceId = String(formData.get("instanceId") ?? "").trim();

  if (!organizationId || !integrationType) {
    throw new Error("Organisation et type d'intégration sont obligatoires.");
  }

  const config: Record<string, string> = {};
  if (url) config.url = url;
  if (instanceId) config.instanceId = instanceId;

  const supabase = await createClient();
  const { error } = await supabase.from("organization_integrations").upsert(
    {
      organization_id: organizationId,
      integration_type: integrationType,
      managed_by: managedBy,
      is_active: isActive,
      config,
    },
    { onConflict: "organization_id,integration_type" }
  );
  if (error) throw error;

  revalidatePath("/parametres");
}
