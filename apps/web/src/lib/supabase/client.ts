import { createBrowserClient } from "@supabase/ssr";

import { hasSupabaseConfig, publicEnv } from "@/lib/env";
import type { SupabaseDatabase } from "@/types/supabase";

export function createClient() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  return createBrowserClient<SupabaseDatabase>(
    publicEnv.supabaseUrl!,
    publicEnv.supabasePublishableKey!,
  );
}
