import { spawnSync } from "node:child_process";
import process from "node:process";

const result = spawnSync(
  "npx",
  ["supabase", "gen", "types", "typescript", "--local", "--schema", "public"],
  { encoding: "utf8" },
);

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

const marker = "type DatabaseWithoutInternals";
if (!result.stdout.includes(marker)) {
  process.stderr.write("Le format des types Supabase generes est inattendu.\n");
  process.exit(1);
}

const generatedTypes = result.stdout.replace(
    marker,
    'export type SupabaseDatabase = Database\n\nexport type SupabaseSchemaName = "public"\n\n' +
      marker,
  );

process.stdout.write(`${generatedTypes.trimEnd()}\n`);
