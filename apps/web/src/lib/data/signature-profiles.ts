import { createClient } from "@/lib/supabase/server";
import type { SignatureProfile } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type SignatureProfileRow = Database["public"]["Tables"]["signature_profiles"]["Row"];

function mapSignatureProfile(row: SignatureProfileRow): SignatureProfile {
  return {
    id: row.id,
    organizationId: row.organization_id,
    label: row.label,
    signerName: row.signer_name,
    signerRole: row.signer_role,
    signatureStyle: row.signature_style,
    whatsappEnabled: row.whatsapp_enabled,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Profils de signature propres à une organisation — gestion du profil en base uniquement, voir
 * database/migrations/0005_multitenant_saas_requirements.sql. La génération réelle de documents
 * signés (Phase 5) n'est pas traitée ici. */
export async function getSignatureProfiles(organizationId: string): Promise<SignatureProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("signature_profiles")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapSignatureProfile);
}
