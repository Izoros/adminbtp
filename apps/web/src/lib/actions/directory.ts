"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

/** Parseur CSV minimal (virgules, champs entre guillemets) — pas de dépendance externe. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/**
 * Import CSV — colonnes attendues : category_code, name, siret, trade_code, address,
 * postal_code, city, phone, email, website, contact_name, contact_role, contact_email,
 * contact_phone (ces 4 dernières optionnelles, créent un contact principal si contact_name
 * renseigné). Déduplication via find_directory_duplicate() (SIRET, sinon nom + code postal) —
 * une fiche dupliquée est comptée en "ignorée", jamais recréée. Pas d'import XLSX (hors scope,
 * voir docs/ROADMAP.md).
 */
export async function importDirectoryCsv(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  const csvText = String(formData.get("csvText") ?? "").trim();
  if (!label || !csvText) {
    throw new Error("Libellé et contenu CSV sont obligatoires.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const [{ data: categories, error: categoriesError }, { data: trades, error: tradesError }] = await Promise.all([
    supabase.from("directory_categories").select("id, code"),
    supabase.from("trade_codes").select("id, code"),
  ]);
  if (categoriesError) throw categoriesError;
  if (tradesError) throw tradesError;
  const categoryByCode = new Map((categories ?? []).map((c) => [c.code, c.id]));
  const tradeByCode = new Map((trades ?? []).map((t) => [t.code, t.id]));

  const rows = parseCsv(csvText);
  const header = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  const dataRows = rows.slice(1);

  const sourceId = randomUUID();
  const { error: sourceInsertError } = await supabase.from("directory_sources").insert({
    id: sourceId,
    label,
    imported_by_user_id: user.id,
  });
  if (sourceInsertError) throw sourceInsertError;

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const rawRow of dataRows) {
    try {
      const record: Record<string, string> = {};
      header.forEach((col, idx) => {
        record[col] = (rawRow[idx] ?? "").trim();
      });

      const categoryId = categoryByCode.get(record.category_code ?? "");
      if (!categoryId || !record.name) {
        errors++;
        continue;
      }

      const siret = record.siret || null;
      const { data: duplicateId, error: dupError } = await supabase.rpc("find_directory_duplicate", {
        p_siret: siret ?? "",
        p_name: record.name,
        p_postal_code: record.postal_code || "",
      });
      if (dupError) throw dupError;
      if (duplicateId) {
        skipped++;
        continue;
      }

      const companyId = randomUUID();
      const { error: insertError } = await supabase.from("directory_companies").insert({
        id: companyId,
        category_id: categoryId,
        name: record.name,
        siret,
        trade_code_id: record.trade_code ? (tradeByCode.get(record.trade_code) ?? null) : null,
        address: record.address || null,
        postal_code: record.postal_code || null,
        city: record.city || null,
        phone: record.phone || null,
        email: record.email || null,
        website: record.website || null,
        source_id: sourceId,
      });
      if (insertError) throw insertError;

      if (record.contact_name) {
        const { error: contactError } = await supabase.from("directory_contacts").insert({
          company_id: companyId,
          full_name: record.contact_name,
          role: record.contact_role || null,
          email: record.contact_email || null,
          phone: record.contact_phone || null,
          is_primary: true,
        });
        if (contactError) throw contactError;
      }

      created++;
    } catch {
      errors++;
    }
  }

  const { error: sourceUpdateError } = await supabase
    .from("directory_sources")
    .update({ created_count: created, skipped_count: skipped, error_count: errors })
    .eq("id", sourceId);
  if (sourceUpdateError) throw sourceUpdateError;

  revalidatePath("/admin");
}
