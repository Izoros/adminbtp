#!/usr/bin/env bash

set -euo pipefail

readonly REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly CONTRACT_SQL="${REPO_ROOT}/scripts/sql/verify-operations-contracts.sql"

if ! command -v psql >/dev/null 2>&1; then
  echo "Echec: psql est requis pour verifier les contrats Supabase." >&2
  exit 1
fi

cd "${REPO_ROOT}"

echo "==> Application non destructive des migrations locales en attente"
npx supabase migration up --local

echo "==> Lint du schema Supabase local"
npx supabase db lint

supabase_status_json="$(npx supabase status -o json 2>/dev/null)"
local_database_url="$(
  printf '%s' "${supabase_status_json}" |
    node -e 'let input=""; process.stdin.on("data", chunk => input += chunk); process.stdin.on("end", () => { const value = JSON.parse(input).DB_URL; if (!value) process.exit(1); process.stdout.write(value); });'
)"

echo "==> Verification transactionnelle des contrats d'exploitation"
psql "${local_database_url}" --no-psqlrc --quiet --file "${CONTRACT_SQL}"

echo "==> Verification Supabase terminee sans reset ni donnee persistante"
