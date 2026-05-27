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
    password: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--email") {
      args.email = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (token === "--password") {
      args.password = argv[index + 1] ?? "";
      index += 1;
    }
  }

  if (!args.email || !args.password) {
    throw new Error(
      "Usage: node scripts/set-user-password.mjs --email <email> --password <mot-de-passe>",
    );
  }

  return {
    email: args.email.trim().toLowerCase(),
    password: args.password,
  };
}

async function main() {
  const { email, password } = parseArgs(process.argv.slice(2));
  const supabaseUrl = readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (error) {
    throw new Error(`Lecture auth.users impossible: ${error.message}`);
  }

  const user = (data.users ?? []).find((entry) => entry.email === email);

  if (!user) {
    throw new Error(`Utilisateur introuvable: ${email}`);
  }

  const updated = await supabase.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  });

  if (updated.error) {
    throw new Error(`Mise a jour mot de passe impossible: ${updated.error.message}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        userId: user.id,
        email,
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
