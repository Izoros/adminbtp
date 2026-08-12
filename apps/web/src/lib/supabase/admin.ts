import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { SupabaseDatabase } from "@/types/supabase";

function readServerEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY") {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

export function createSupabaseAdminClient() {
  const supabaseUrl = readServerEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = readServerEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient<SupabaseDatabase>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
