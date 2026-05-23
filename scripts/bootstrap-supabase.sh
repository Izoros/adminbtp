#!/usr/bin/env bash

set -euo pipefail

echo "==> Preflight Supabase"
npm run supabase:check

echo "==> Demarrage Supabase"
npm run supabase:start

echo "==> Reset des migrations"
npm run supabase:reset

echo "==> Generation des types"
npm run supabase:types

echo "==> Bootstrap Supabase termine"
