#!/usr/bin/env bash

set -euo pipefail

readonly PROD_URL="${1:-https://adminbtp.vercel.app}"
readonly HEALTH_URL="${PROD_URL%/}/api/health"
readonly WHATSAPP_WEBHOOK_URL="${PROD_URL%/}/api/webhooks/whatsapp"
headers_file="$(mktemp)"

cleanup() {
  rm -f "${headers_file}"
}

trap cleanup EXIT

echo "==> Verification production: ${PROD_URL}"

# On commence par les parcours critiques pour echouer vite en cas de regression visible.
bash "$(dirname "$0")/verify-smoke.sh" "${PROD_URL}"
node "$(dirname "$0")/verify-app-links.mjs" "${PROD_URL}"

if [[ -n "${ADMINBTP_AUDIT_EMAIL:-}" || -n "${ADMINBTP_AUDIT_PASSWORD:-}" ]]; then
  if [[ -z "${ADMINBTP_AUDIT_EMAIL:-}" || -z "${ADMINBTP_AUDIT_PASSWORD:-}" ]]; then
    echo "Echec audit authentifie: email et mot de passe doivent etre fournis ensemble" >&2
    exit 1
  fi

  node "$(dirname "$0")/verify-app-links.mjs" "${PROD_URL}" --authenticated
fi

root_status="$(curl -s -D "${headers_file}" -o /dev/null -w '%{http_code}' "${PROD_URL}")"
if [[ "${root_status}" != "200" ]]; then
  echo "Echec verification racine: statut ${root_status}" >&2
  exit 1
fi

echo "==> Racine OK (${root_status})"

required_headers=(
  "content-security-policy:"
  "strict-transport-security:"
  "x-content-type-options: nosniff"
  "x-frame-options: DENY"
  "permissions-policy:"
  "referrer-policy:"
)

for header in "${required_headers[@]}"; do
  if ! grep -iq "^${header}" "${headers_file}"; then
    echo "Echec verification securite: en-tete manquant ${header}" >&2
    exit 1
  fi
done

echo "==> En-tetes de securite OK"

health_payload="$(curl -s "${HEALTH_URL}")"
health_status="$(printf '%s' "${health_payload}" | sed -n 's/.*"status":"\([^"]*\)".*/\1/p')"
health_service="$(printf '%s' "${health_payload}" | sed -n 's/.*"service":"\([^"]*\)".*/\1/p')"

if [[ "${health_status}" != "ok" ]]; then
  echo "Echec verification health: payload inattendu ${health_payload}" >&2
  exit 1
fi

if [[ "${health_service}" != "adminbtp-web" ]]; then
  echo "Echec verification health: service inattendu ${health_payload}" >&2
  exit 1
fi

echo "==> Health OK (${HEALTH_URL})"

whatsapp_status="$(curl -s -o /dev/null -w '%{http_code}' "${WHATSAPP_WEBHOOK_URL}")"
if [[ "${whatsapp_status}" != "403" && "${whatsapp_status}" != "503" ]]; then
  echo "Echec verification WhatsApp: le webhook sans challenge doit echouer ferme, statut ${whatsapp_status}" >&2
  exit 1
fi

echo "==> Webhook WhatsApp ferme sans challenge (${whatsapp_status})"
echo "==> Verification production terminee"
