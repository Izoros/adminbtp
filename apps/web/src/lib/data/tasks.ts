import { createClient } from "@/lib/supabase/server";
import type { Task } from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    organizationId: row.organization_id,
    siteId: row.site_id ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    priority: row.priority,
    assignedUserId: row.assigned_user_id ?? undefined,
    dueDate: row.due_date ?? undefined,
    sourceType: row.source_type,
    sourceId: row.source_id ?? undefined,
    createdAt: row.created_at,
  };
}

export async function getTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").select("*").order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map(mapTask);
}

export async function getTasksBySite(siteId: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("site_id", siteId)
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map(mapTask);
}
