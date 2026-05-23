#!/usr/bin/env bash

set -euo pipefail

echo "==> Verification du CLI Supabase"
if ! npx supabase --version >/dev/null 2>&1; then
  echo "KO: le CLI Supabase n'est pas disponible."
  exit 1
fi
echo "OK: CLI Supabase disponible"

echo "==> Verification de la configuration locale"
if [ ! -f "supabase/config.toml" ]; then
  echo "KO: fichier supabase/config.toml introuvable."
  exit 1
fi
echo "OK: supabase/config.toml present"

echo "==> Verification des migrations"
if [ ! -d "supabase/migrations" ]; then
  echo "KO: dossier supabase/migrations introuvable."
  exit 1
fi

migration_count="$(find supabase/migrations -maxdepth 1 -type f | wc -l | tr -d ' ')"
if [ "${migration_count}" -lt 1 ]; then
  echo "KO: aucune migration detectee."
  exit 1
fi
echo "OK: ${migration_count} migration(s) detectee(s)"

echo "==> Verification du daemon Docker"
if docker info >/dev/null 2>&1; then
  echo "OK: daemon Docker actif"
else
  echo "KO: daemon Docker injoignable. Demarrer Docker Desktop ou un runtime compatible."
fi

echo "==> Verification des variables publiques Supabase"
if [ -f ".env.local" ]; then
  if rg -n "^NEXT_PUBLIC_SUPABASE_URL=" .env.local >/dev/null 2>&1 && \
     rg -n "^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=" .env.local >/dev/null 2>&1; then
    echo "OK: variables publiques Supabase detectees dans .env.local"
  else
    echo "KO: .env.local present mais variables Supabase incomplètes."
  fi
else
  echo "KO: .env.local absent. Copier .env.example puis renseigner les valeurs."
fi

echo "==> Verification terminee"
