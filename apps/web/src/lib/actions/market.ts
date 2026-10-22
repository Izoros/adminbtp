"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import type { MarketContractType } from "@adminbtp/types";

/** Aucun délai/taux par défaut implicite : seuls les champs renseignés sont enregistrés. */
export async function createMarketContract(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const lotId = String(formData.get("lotId") ?? "").trim();
  const contractType = String(formData.get("contractType") ?? "").trim() as MarketContractType;
  const priceReferenceMonth = String(formData.get("priceReferenceMonth") ?? "").trim();
  const retentionRaw = String(formData.get("retentionGuaranteeRate") ?? "").trim();
  const paymentTermRaw = String(formData.get("paymentTermDays") ?? "").trim();
  const retentionBasisRaw = String(formData.get("retentionBasisAmountHt") ?? "").trim();
  const retentionReleaseDueOn = String(formData.get("retentionReleaseDueOn") ?? "").trim();
  const retentionSubstitutedByCaution = formData.get("retentionSubstitutedByCaution") === "on";
  const advanceAmountRaw = String(formData.get("advanceAmountHt") ?? "").trim();

  if (!siteId || !contractType) throw new Error("Chantier et type de marché sont obligatoires.");

  const supabase = await createClient();
  const id = randomUUID();
  const { error } = await supabase.from("market_contracts").insert({
    id,
    site_id: siteId,
    lot_id: lotId || null,
    contract_type: contractType,
    price_reference_month: priceReferenceMonth || null,
    retention_guarantee_rate: retentionRaw ? Number(retentionRaw) / 100 : null,
    payment_term_days: paymentTermRaw ? Number(paymentTermRaw) : null,
    retention_basis_amount_ht: retentionBasisRaw ? Number(retentionBasisRaw) : null,
    retention_release_due_on: retentionReleaseDueOn || null,
    retention_substituted_by_caution: retentionSubstitutedByCaution,
    advance_amount_ht: advanceAmountRaw ? Number(advanceAmountRaw) : null,
  });
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
}

/** Saisie manuelle uniquement (pas d'écran OCR réel) — origine SAISIE, validée par construction. */
export async function createPriceLine(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim(); // pour revalidatePath uniquement
  const lotId = String(formData.get("lotId") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const quantityMarket = Number(formData.get("quantityMarket") ?? 0);
  const unitPriceHt = Number(formData.get("unitPriceHt") ?? 0);
  const amendmentId = String(formData.get("amendmentId") ?? "").trim() || null;

  if (!lotId || !code || !label || !unit) {
    throw new Error("Lot, code, libellé et unité sont obligatoires.");
  }

  const supabase = await createClient();
  const id = randomUUID();
  const { error } = await supabase.from("price_lines").insert({
    id,
    lot_id: lotId,
    code,
    label,
    unit,
    quantity_market: quantityMarket,
    unit_price_ht: unitPriceHt,
    origin: "SAISIE",
    status: "VALIDE",
    amendment_id: amendmentId,
  });
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
}
