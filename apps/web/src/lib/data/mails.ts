import { createClient } from "@/lib/supabase/server";
import type { MailThread, MailAddress } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type MailThreadRow = Database["public"]["Tables"]["mail_threads"]["Row"];
type MailAddressRow = Database["public"]["Tables"]["mail_addresses"]["Row"];

function mapMailThread(row: MailThreadRow): MailThread {
  return {
    id: row.id,
    organizationId: row.organization_id,
    mailAddressId: row.mail_address_id,
    siteId: row.site_id ?? undefined,
    subject: row.subject,
    fromAddress: row.from_address,
    status: row.status,
    urgency: row.urgency,
    assignedUserId: row.assigned_user_id ?? undefined,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
  };
}

function mapMailAddress(row: MailAddressRow): MailAddress {
  return {
    id: row.id,
    organizationId: row.organization_id,
    address: row.address,
    label: row.label,
    siteId: row.site_id ?? undefined,
    isActive: row.is_active,
  };
}

export async function getMailThreads(): Promise<MailThread[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mail_threads")
    .select("*")
    .order("last_message_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapMailThread);
}

export async function getMailThreadsBySite(siteId: string): Promise<MailThread[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mail_threads")
    .select("*")
    .eq("site_id", siteId)
    .order("last_message_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapMailThread);
}

export async function getMailAddresses(): Promise<MailAddress[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("mail_addresses").select("*");
  if (error) throw error;
  return (data ?? []).map(mapMailAddress);
}
