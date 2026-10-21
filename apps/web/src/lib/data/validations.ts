import { createClient } from "@/lib/supabase/server";
import type { ValidationRecord } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type ValidationRecordRow = Database["public"]["Tables"]["validation_records"]["Row"];

function mapValidationRecord(row: ValidationRecordRow): ValidationRecord {
  return {
    id: row.id,
    documentId: row.document_id,
    step: row.step,
    decision: row.decision ?? undefined,
    decidedByUserId: row.decided_by_user_id ?? undefined,
    decidedAt: row.decided_at ?? undefined,
    comment: row.comment ?? undefined,
    whatsappProofUrl: row.whatsapp_proof_url ?? undefined,
    signatureProvider: row.signature_provider ?? undefined,
    signatureEnvelopeId: row.signature_envelope_id ?? undefined,
    isLegallyBindingSignature: row.is_legally_binding_signature,
  };
}

export async function getValidationRecords(): Promise<ValidationRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("validation_records").select("*");
  if (error) throw error;
  return (data ?? []).map(mapValidationRecord);
}
