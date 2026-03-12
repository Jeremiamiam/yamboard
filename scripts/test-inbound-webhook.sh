#!/bin/bash
# Test manuel du webhook inbound email (contourne la signature Svix).
# Usage:
#   1. Ajoute INBOUND_TEST_SECRET=monsecret dans .env.local
#   2. ./scripts/test-inbound-webhook.sh [email_id] [from] [subject]
#
# Exemple avec le mail de Corentin:
#   ./scripts/test-inbound-webhook.sh 3717e161-b808-4760-948a-20110664fd11 "corentin@agence-yam.fr" "Fw: deck light et pro"

set -e
cd "$(dirname "$0")/.."

# Charger .env.local
export $(grep -v '^#' .env.local | xargs 2>/dev/null) || true

EMAIL_ID="${1:-3717e161-b808-4760-948a-20110664fd11}"
FROM="${2:-corentin@agence-yam.fr}"
SUBJECT="${3:-Fw: deck light et pro}"
SECRET="${INBOUND_TEST_SECRET}"

if [ -z "$SECRET" ]; then
  echo "Erreur: INBOUND_TEST_SECRET manquant dans .env.local"
  exit 1
fi

BASE_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
echo "POST $BASE_URL/api/webhooks/inbound-email"
echo "email_id=$EMAIL_ID from=$FROM subject=$SUBJECT"
echo ""

curl -s -X POST "$BASE_URL/api/webhooks/inbound-email" \
  -H "Content-Type: application/json" \
  -H "X-Test-Secret: $SECRET" \
  -d "{\"__test\":true,\"type\":\"email.received\",\"data\":{\"email_id\":\"$EMAIL_ID\",\"from\":\"$FROM\",\"subject\":\"$SUBJECT\"}}" \
  | jq .
