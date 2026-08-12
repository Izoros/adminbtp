#!/usr/bin/env bash

set -euo pipefail

readonly BASE_URL="${1:-http://127.0.0.1:3000}"

tmp_dir="$(mktemp -d)"

cleanup() {
  rm -rf "${tmp_dir}"
}

trap cleanup EXIT

route_specs=(
  "/|200|text/html|AdminBTP"
  "/login|200|text/html|Acces AdminBTP"
  "/guide|200,302,303,307,308|text/html|Didacticiel AdminBTP"
  "/admin|200,302,303,307,308|text/html|"
  "/admin/archives|200,302,303,307,308|text/html|"
  "/admin/alerts|200,302,303,307,308|text/html|"
  "/admin/commands|200,302,303,307,308|text/html|"
  "/admin/readiness|200,302,303,307,308|text/html|"
  "/organizations|200,302,303,307,308|text/html|"
  "/projects|200,302,303,307,308|text/html|"
  "/documents|200,302,303,307,308|text/html|"
  "/signatures|200,302,303,307,308|text/html|"
  "/emails|200,302,303,307,308|text/html|"
  "/phases|200,302,303,307,308|text/html|"
  "/n8n|200,302,303,307,308|text/html|"
  "/odoo|200,302,303,307,308|text/html|"
  "/consulting|200,302,303,307,308|text/html|"
  "/ai|200,302,303,307,308|text/html|"
  "/client-space|200,302,303,307,308|text/html|"
  "/followups|200,302,303,307,308|text/html|"
  "/api/cron/market-archive|401|application/json|unauthorized"
  "/api/cron/operations-alerts|401|application/json|unauthorized"
)

error_markers=(
  "<title>404: This page could not be found.</title>"
  "<h2 style=\"font-size:14px;font-weight:400;line-height:49px;margin:0\">This page could not be found.</h2>"
  "<title>Application error:"
  "<h2>Application error: a server-side exception has occurred"
  "<title>500: Internal Server Error</title>"
  "\"code\":\"DEPLOYMENT_NOT_FOUND\""
)

assert_status_allowed() {
  local actual_status="$1"
  local allowed_statuses="$2"

  IFS=',' read -r -a allowed_list <<< "${allowed_statuses}"
  for expected_status in "${allowed_list[@]}"; do
    if [[ "${actual_status}" == "${expected_status}" ]]; then
      return 0
    fi
  done

  echo "Echec smoke: statut ${actual_status} hors liste autorisee ${allowed_statuses}" >&2
  return 1
}

assert_route() {
  local route_path="$1"
  local allowed_statuses="$2"
  local expected_content_type="$3"
  local expected_marker="$4"

  local safe_name
  safe_name="$(printf '%s' "${route_path}" | tr '/:?&=' '_')"
  local body_file="${tmp_dir}/${safe_name}.body"
  local headers_file="${tmp_dir}/${safe_name}.headers"
  local url="${BASE_URL%/}${route_path}"
  local status

  status="$(
    curl -sS -L \
      -D "${headers_file}" \
      -o "${body_file}" \
      -w '%{http_code}' \
      "${url}"
  )"

  assert_status_allowed "${status}" "${allowed_statuses}"

  if ! grep -iq "^content-type: .*${expected_content_type}" "${headers_file}"; then
    echo "Echec smoke: content-type inattendu pour ${route_path}" >&2
    return 1
  fi

  if [[ -n "${expected_marker}" ]] && ! grep -Fq "${expected_marker}" "${body_file}"; then
    echo "Echec smoke: marqueur attendu absent pour ${route_path}: ${expected_marker}" >&2
    return 1
  fi

  for marker in "${error_markers[@]}"; do
    if grep -Fq "${marker}" "${body_file}"; then
      echo "Echec smoke: marqueur d erreur detecte sur ${route_path}: ${marker}" >&2
      return 1
    fi
  done

  echo "==> Smoke OK ${route_path} (${status})"
}

echo "==> Verification smoke: ${BASE_URL}"

for route_spec in "${route_specs[@]}"; do
  IFS='|' read -r route_path allowed_statuses expected_content_type expected_marker <<< "${route_spec}"
  assert_route "${route_path}" "${allowed_statuses}" "${expected_content_type}" "${expected_marker}"
done

echo "==> Verification smoke terminee"
