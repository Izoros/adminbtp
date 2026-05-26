function readPublicEnv(
  name:
    | "NEXT_PUBLIC_SUPABASE_URL"
    | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    | "NEXT_PUBLIC_SUPABASE_ANON_KEY",
) {
  const value = process.env[name];

  // On laisse la phase 0 demarrer meme sans variables, tout en rendant l'absence visible.
  if (!value) {
    return null;
  }

  return value;
}

export const publicEnv = {
  supabaseUrl: readPublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabasePublishableKey:
    readPublicEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ??
    readPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
};

export function hasSupabaseConfig() {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabasePublishableKey);
}

export function extractSupabaseProjectRef(url: string | null | undefined) {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const hostnameParts = parsedUrl.hostname.split(".");

    if (hostnameParts.length < 3 || hostnameParts[1] !== "supabase") {
      return null;
    }

    return hostnameParts[0] || null;
  } catch {
    return null;
  }
}

export function getSupabaseProjectRef() {
  return extractSupabaseProjectRef(publicEnv.supabaseUrl);
}
