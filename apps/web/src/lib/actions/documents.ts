"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import type { DocumentCategory } from "@adminbtp/types";

export async function createDocument(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const siteId = String(formData.get("siteId") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() as DocumentCategory;
  const title = String(formData.get("title") ?? "").trim();

  if (!organizationId || !category || !title) {
    throw new Error("Organisation, catégorie et titre sont obligatoires.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  // Règle produit non négociable : un PPSPS généré par la plateforme naît toujours en
  // PREEDITION, jamais directement VALIDE/ENVOYE — voir docs/VALIDATION_CHECKLIST.md. Tout autre
  // document créé manuellement démarre en BROUILLON : la création ne doit jamais sauter les
  // étapes du circuit de contrôle.
  const status = category === "PPSPS" ? "PREEDITION" : "BROUILLON";

  // Pas de stockage de fichiers réel branché (Phase 3, voir docs/ROADMAP.md) — chemin de
  // substitution cohérent avec les documents de démonstration existants.
  const fileUrl = `demo://documents/${randomUUID()}.pdf`;

  const { error } = await supabase.from("documents").insert({
    organization_id: organizationId,
    site_id: siteId || null,
    category,
    title,
    status,
    file_url: fileUrl,
    created_by_user_id: user.id,
  });

  if (error) throw error;

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  redirect("/documents");
}
