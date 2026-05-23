#!/usr/bin/env bash

set -euo pipefail

echo "==> Lint"
npm run lint

echo "==> Typecheck"
npm run typecheck

echo "==> Garde-fous serveur"
npm run verify:guards

echo "==> Tests"
npm run test

echo "==> Build"
npm run build

echo "==> Validation terminee"
