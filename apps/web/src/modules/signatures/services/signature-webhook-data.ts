import { createClient } from "@/lib/supabase/server";
import { normalizeWhatsappPayload } from "@/modules/signatures/services/signature-data";
import type { SignatureWhatsappPayload } from "@/modules/signatures/types/signature";

export type ResolvedSignatureWebhookContext = {
  dataOrigin: "demo" | "supabase";
  requestId: string;
  organizationId?: string;
  whatsappPayload: SignatureWhatsappPayload | null;
};

export async function resolveSignatureWebhookContext(
  signatureRequestId: string,
): Promise<ResolvedSignatureWebhookContext> {
  const supabase = await createClient();

  if (!supabase) {
    return {
      dataOrigin: "demo",
      requestId: signatureRequestId,
      whatsappPayload: null,
    };
  }

  try {
    const { data: requestRow, error: requestError } = await supabase
      .from("signature_requests")
      .select("*")
      .eq("id", signatureRequestId)
      .maybeSingle();

    if (requestError || !requestRow) {
      return {
        dataOrigin: "demo",
        requestId: signatureRequestId,
        whatsappPayload: null,
      };
    }

    const { data: documentRow } = await supabase
      .from("documents")
      .select("*")
      .eq("id", requestRow.document_id)
      .maybeSingle();

    return {
      dataOrigin: "supabase",
      requestId: signatureRequestId,
      organizationId: requestRow.organization_id,
      whatsappPayload: normalizeWhatsappPayload(
        requestRow.whatsapp_payload,
        requestRow,
        documentRow ?? null,
      ),
    };
  } catch {
    return {
      dataOrigin: "demo",
      requestId: signatureRequestId,
      whatsappPayload: null,
    };
  }
}
