#!/usr/bin/env sh
#
# Generate secrets and JWT API keys for Holy Ranking / Supabase self-hosting.
# Based on https://github.com/supabase/supabase/blob/master/docker/utils/generate-keys.sh
#
# Usage:
#   sh scripts/generate-env.sh              # print keys only
#   sh scripts/generate-env.sh --update-env # write keys into .env
#

set -e

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

gen_hex() {
  openssl rand -hex "$1"
}

gen_base64() {
  openssl rand -base64 "$1"
}

base64_url_encode() {
  openssl enc -base64 -A | tr '+/' '-_' | tr -d '='
}

gen_token() {
  payload=$1
  payload_base64=$(printf %s "$payload" | base64_url_encode)
  header_base64=$(printf %s "$header" | base64_url_encode)
  signed_content="${header_base64}.${payload_base64}"
  signature=$(printf %s "$signed_content" | openssl dgst -binary -sha256 -hmac "$jwt_secret" | base64_url_encode)
  printf '%s' "${signed_content}.${signature}"
}

if ! command -v openssl >/dev/null 2>&1; then
  echo "Error: openssl is required but not found."
  exit 1
fi

jwt_secret="$(gen_base64 30)"
header='{"alg":"HS256","typ":"JWT"}'
iat=$(date +%s)
exp=$((iat + 5 * 3600 * 24 * 365))

anon_payload="{\"role\":\"anon\",\"iss\":\"supabase\",\"iat\":$iat,\"exp\":$exp}"
service_role_payload="{\"role\":\"service_role\",\"iss\":\"supabase\",\"iat\":$iat,\"exp\":$exp}"

anon_key=$(gen_token "$anon_payload")
service_role_key=$(gen_token "$service_role_payload")
pg_meta_crypto_key=$(gen_base64 24)
postgres_password=$(gen_hex 16)
dashboard_password=$(gen_hex 16)

echo ""
echo "JWT_SECRET=${jwt_secret}"
echo "ANON_KEY=${anon_key}"
echo "SERVICE_ROLE_KEY=${service_role_key}"
echo "PG_META_CRYPTO_KEY=${pg_meta_crypto_key}"
echo "POSTGRES_PASSWORD=${postgres_password}"
echo "DASHBOARD_PASSWORD=${dashboard_password}"
echo ""

if [ "$1" != "--update-env" ]; then
  echo "Pass --update-env to write these values into .env"
  exit 0
fi

if [ ! -f "$ENV_FILE" ]; then
  if [ -f "${ROOT_DIR}/.env.example" ]; then
    cp "${ROOT_DIR}/.env.example" "$ENV_FILE"
    echo "Created .env from .env.example"
  else
    echo "Error: .env not found. Copy .env.example to .env first."
    exit 1
  fi
fi

echo "Updating .env..."

sed \
  -i.bak \
  -e "s|^JWT_SECRET=.*$|JWT_SECRET=${jwt_secret}|" \
  -e "s|^ANON_KEY=.*$|ANON_KEY=${anon_key}|" \
  -e "s|^SERVICE_ROLE_KEY=.*$|SERVICE_ROLE_KEY=${service_role_key}|" \
  -e "s|^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*$|NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon_key}|" \
  -e "s|^SUPABASE_SERVICE_ROLE_KEY=.*$|SUPABASE_SERVICE_ROLE_KEY=${service_role_key}|" \
  -e "s|^PG_META_CRYPTO_KEY=.*$|PG_META_CRYPTO_KEY=${pg_meta_crypto_key}|" \
  -e "s|^POSTGRES_PASSWORD=.*$|POSTGRES_PASSWORD=${postgres_password}|" \
  -e "s|^DASHBOARD_PASSWORD=.*$|DASHBOARD_PASSWORD=${dashboard_password}|" \
  -e "s|^DATABASE_URL=.*$|DATABASE_URL=postgresql://postgres:${postgres_password}@localhost:5432/postgres|" \
  "$ENV_FILE"

rm -f "${ENV_FILE}.bak"

LOCAL_ENV_FILE="${ROOT_DIR}/.env.local"
if [ -f "$LOCAL_ENV_FILE" ]; then
  echo "Syncing Next.js keys into .env.local..."
  sed \
    -i.bak \
    -e "s|^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*$|NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon_key}|" \
    -e "s|^SUPABASE_SERVICE_ROLE_KEY=.*$|SUPABASE_SERVICE_ROLE_KEY=${service_role_key}|" \
    -e "s|^DATABASE_URL=.*$|DATABASE_URL=postgresql://postgres:${postgres_password}@localhost:5432/postgres|" \
    "$LOCAL_ENV_FILE"
  rm -f "${LOCAL_ENV_FILE}.bak"
fi

echo "Done. Review .env before starting Docker."
echo "If Docker was already started with an old POSTGRES_PASSWORD, reset the DB volume:"
echo "  docker compose down -v"
echo "  docker compose up -d db auth rest kong meta studio"
