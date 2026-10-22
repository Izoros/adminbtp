"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DemoAIProvider } from "@adminbtp/integrations";
import type { Json } from "@adminbtp/types";

/**
 * Contrôle IA d'un document — fait au plus passer le document en EN_CONTROLE, jamais VALIDE.
 * Pas de nouveau statut "validé par IA" : seul un humain (VALIDATEUR, via l'action de validation
 * existante côté chantier) peut faire passer un document à VALIDE.
 */
export async function runAiReview(documentId: string) {
  const supabase = await createClient();

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id, category, title, status, site_id")
    .eq("id", documentId)
    .single();
  if (documentError) throw documentError;

  const ai = new DemoAIProvider();
  const result = await ai.reviewDocument(document.category, document.title);

  const { error: reviewError } = await supabase.from("document_reviews").insert({
    document_id: documentId,
    source: "AI",
    verdict: result.verdict,
    findings: result.findings as Json,
  });
  if (reviewError) throw reviewError;

  if (document.status === "BROUILLON" || document.status === "PREEDITION") {
    const { error: updateError } = await supabase
      .from("documents")
      .update({ status: "EN_CONTROLE" })
      .eq("id", documentId);
    if (updateError) throw updateError;
  }

  if (document.site_id) revalidatePath(`/chantiers/${document.site_id}`);
  revalidatePath("/documents");
}
