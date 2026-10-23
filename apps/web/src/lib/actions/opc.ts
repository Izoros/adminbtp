"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  TechnicalOpinionIssuerRole,
  TechnicalOpinionKind,
  TechnicalOpinionVerdict,
  TechnicalOpinionStatus,
} from "@adminbtp/types";

/** Note de coordination OPC par lot — une consigne courte par semaine, jamais un moteur de planning. */
export async function createLotScheduleNote(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim(); // revalidation uniquement
  const lotId = String(formData.get("lotId") ?? "").trim();
  const week = String(formData.get("week") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const needsLotId = String(formData.get("needsLotId") ?? "").trim() || null;
  if (!lotId || !week || !note) throw new Error("Lot, semaine et consigne sont obligatoires.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { error } = await supabase.from("lot_schedule_notes").insert({
    lot_id: lotId,
    week,
    note,
    needs_lot_id: needsLotId,
    created_by_user_id: user.id,
  });
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
}

/**
 * Avis technique (CT/SPS/BET/CSSI). L'émetteur doit porter ce rôle, actif, sur ce chantier —
 * vérifié ici via site_participants, pas par une policy RLS (même choix que pour les actes et les
 * réunions, voir acts.ts/execution.ts). Un avis CT SUSPENDU ou DEFAVORABLE ne bloque jamais un
 * visa : il s'affiche seulement sur l'écran de visa MOE, qui tranche. Une observation SPS ne crée
 * jamais de réserve (ReserveItem) — ce n'est pas le même circuit.
 */
export async function createTechnicalOpinion(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const issuerOrganizationId = String(formData.get("issuerOrganizationId") ?? "").trim();
  const issuerRole = String(formData.get("issuerRole") ?? "").trim() as TechnicalOpinionIssuerRole;
  const lotId = String(formData.get("lotId") ?? "").trim() || null;
  const documentId = String(formData.get("documentId") ?? "").trim() || null;
  const kind = String(formData.get("kind") ?? "").trim() as TechnicalOpinionKind;
  const verdictRaw = String(formData.get("verdict") ?? "").trim();
  const verdict = (verdictRaw || null) as TechnicalOpinionVerdict | null;
  const text = String(formData.get("text") ?? "").trim();
  const status = String(formData.get("status") ?? "BROUILLON").trim() as TechnicalOpinionStatus;

  if (!siteId || !issuerOrganizationId || !issuerRole || !kind || !text) {
    throw new Error("Chantier, organisation, rôle, nature et texte sont obligatoires.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: participation } = await supabase
    .from("site_participants")
    .select("id")
    .eq("site_id", siteId)
    .eq("organization_id", issuerOrganizationId)
    .eq("mission_role", issuerRole)
    .is("left_at", null)
    .maybeSingle();
  if (!participation) {
    throw new Error(`Seule une organisation avec le rôle "${issuerRole}" actif sur ce chantier peut émettre cet avis.`);
  }

  const { error } = await supabase.from("technical_opinions").insert({
    site_id: siteId,
    lot_id: lotId,
    document_id: documentId,
    issuer_organization_id: issuerOrganizationId,
    issuer_role: issuerRole,
    kind,
    verdict,
    text,
    status,
    created_by_user_id: user.id,
  });
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
}
