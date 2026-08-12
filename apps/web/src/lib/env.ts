function normalizePublicEnv(value: string | undefined) {
  // On laisse la phase 0 demarrer meme sans variables, tout en rendant l'absence visible.
  if (!value) {
    return null;
  }

  return value;
}

export const publicEnv = {
  // Next.js remplace uniquement les acces statiques NEXT_PUBLIC_* dans le bundle client.
  // Ne pas repasser par process.env[name], sinon serveur et navigateur divergent.
  supabaseUrl: normalizePublicEnv(process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabasePublishableKey:
    normalizePublicEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
    normalizePublicEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
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
