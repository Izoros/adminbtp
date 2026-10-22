"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

export async function createSituation(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const lotId = String(formData.get("lotId") ?? "").trim();
  const numberRaw = String(formData.get("number") ?? "").trim();

  if (!siteId || !numberRaw) throw new Error("Chantier et numéro sont obligatoires.");

  const supabase = await createClient();
  const id = randomUUID();
  const { error } = await supabase.from("situations").insert({
    id,
    site_id: siteId,
    lot_id: lotId || null,
    number: Number(numberRaw),
    amount_ht: 0,
    status: "A_ETABLIR",
  });
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
}

/**
 * `quantityPrevious` est calculée automatiquement (somme des quantités déjà déclarées pour cette
 * ligne de prix, toutes situations confondues) plutôt que saisie — évite une incohérence de
 * cumul laissée au choix de l'utilisateur.
 */
export async function addSituationLine(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim(); // revalidation uniquement
  const situationId = String(formData.get("situationId") ?? "").trim();
  const priceLineId = String(formData.get("priceLineId") ?? "").trim();
  const quantityMonthRaw = String(formData.get("quantityMonth") ?? "").trim();

  if (!situationId || !priceLineId || !quantityMonthRaw) {
    throw new Error("Situation, ligne de prix et quantité sont obligatoires.");
  }

  const supabase = await createClient();

  const { data: priceLine, error: priceLineError } = await supabase
    .from("price_lines")
    .select("unit_price_ht")
    .eq("id", priceLineId)
    .single();
  if (priceLineError) throw priceLineError;

  const { data: previousLines, error: previousError } = await supabase
    .from("situation_lines")
    .select("quantity_month")
    .eq("price_line_id", priceLineId);
  if (previousError) throw previousError;

  const quantityPrevious = (previousLines ?? []).reduce((sum, l) => sum + Number(l.quantity_month), 0);
  const quantityMonth = Number(quantityMonthRaw);
  const amountHt = quantityMonth * priceLine.unit_price_ht;

  const { error } = await supabase.from("situation_lines").insert({
    situation_id: situationId,
    price_line_id: priceLineId,
    quantity_previous: quantityPrevious,
    quantity_month: quantityMonth,
    unit_price_ht: priceLine.unit_price_ht,
    amount_ht: amountHt,
  });
  if (error) throw error;

  // Montant HT total de l'en-tête = somme des lignes — sans polish, pas de recalcul des champs
  // d'actualisation/retenue/pénalités ici (saisis séparément, voir docs/ROADMAP.md).
  const { data: allLines, error: allLinesError } = await supabase
    .from("situation_lines")
    .select("amount_ht")
    .eq("situation_id", situationId);
  if (allLinesError) throw allLinesError;
  const totalHt = (allLines ?? []).reduce((sum, l) => sum + Number(l.amount_ht), 0);

  const { error: updateError } = await supabase
    .from("situations")
    .update({ amount_ht: totalHt })
    .eq("id", situationId);
  if (updateError) throw updateError;

  revalidatePath(`/chantiers/${siteId}`);
}

/**
 * La policy d'écriture laisse passer n'importe quelle organisation bénéficiaire ; c'est le
 * trigger `check_subcontractor_allocation` (voir database/migrations/0013) qui refuse une
 * ventilation vers un sous-traitant sans DC4/agrément VALIDE — l'erreur Postgres remonte telle
 * quelle à l'utilisateur.
 */
export async function addSituationAllocation(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const situationId = String(formData.get("situationId") ?? "").trim();
  const payeeOrganizationId = String(formData.get("payeeOrganizationId") ?? "").trim();
  const amountHtRaw = String(formData.get("amountHt") ?? "").trim();

  if (!situationId || !payeeOrganizationId || !amountHtRaw) {
    throw new Error("Situation, organisation bénéficiaire et montant sont obligatoires.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("situation_allocations").insert({
    situation_id: situationId,
    payee_organization_id: payeeOrganizationId,
    amount_ht: Number(amountHtRaw),
  });
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
}
