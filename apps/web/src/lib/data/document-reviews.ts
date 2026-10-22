import { createClient } from "@/lib/supabase/server";
import type { DocumentReview } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type DocumentReviewRow = Database["public"]["Tables"]["document_reviews"]["Row"];

function mapDocumentReview(row: DocumentReviewRow): DocumentReview {
  return {
    id: row.id,
    documentId: row.document_id,
    source: row.source,
    verdict: row.verdict,
    findings: (row.findings as Record<string, unknown>) ?? {},
    createdByUserId: row.created_by_user_id ?? undefined,
    createdAt: row.created_at,
  };
}

export async function getDocumentReviews(documentId: string): Promise<DocumentReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_reviews")
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapDocumentReview);
}
