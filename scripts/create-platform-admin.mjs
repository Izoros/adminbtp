import { createClient } from "@supabase/supabase-js";

function readRequiredEnv(name) {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Variable requise absente: ${name}`);
  }

  return value.trim();
}

function parseArgs(argv) {
  const args = {
    email: "",
    fullName: "",
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--email") {
      args.email = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (token === "--full-name") {
      args.fullName = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (token === "--dry-run") {
      args.dryRun = true;
    }
  }

  if (!args.email) {
    throw new Error("Usage: node scripts/create-platform-admin.mjs --email <email> [--full-name <nom>] [--dry-run]");
  }

  return {
    email: args.email.trim().toLowerCase(),
    fullName: args.fullName.trim(),
    dryRun: args.dryRun,
  };
}

async function resolveExistingProfile(supabase, email) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id,email,full_name,internal_role")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(`Lecture user_profiles impossible: ${error.message}`);
  }

  return data;
}

async function createAuthUser(supabase, email, fullName) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });

  if (error) {
    throw new Error(`Creation auth user impossible: ${error.message}`);
  }

  if (!data.user) {
    throw new Error("Creation auth user impossible: aucun utilisateur retourne.");
  }

  return data.user;
}

async function promoteProfile(supabase, userId, email, fullName) {
  const payload = {
    id: userId,
    email,
    ...(fullName ? { full_name: fullName } : {}),
    internal_role: "platform_admin",
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("user_profiles").upsert(payload, {
    onConflict: "id",
  });

  if (error) {
    throw new Error(`Promotion platform_admin impossible: ${error.message}`);
  }
}

async function main() {
  const { email, fullName, dryRun } = parseArgs(process.argv.slice(2));
  const supabaseUrl = readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const existingProfile = await resolveExistingProfile(supabase, email);

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          email,
          fullName: fullName || null,
          action: existingProfile ? "promote_existing_profile" : "create_auth_user_then_promote",
          existingProfile,
        },
        null,
        2,
      ),
    );
    return;
  }

  let userId = existingProfile?.id ?? null;

  if (!userId) {
    const createdUser = await createAuthUser(supabase, email, fullName);
    userId = createdUser.id;
  }

  await promoteProfile(supabase, userId, email, fullName);

  console.log(
    JSON.stringify(
      {
        ok: true,
        email,
        userId,
        internalRole: "platform_admin",
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
