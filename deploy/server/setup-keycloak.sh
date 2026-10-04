#!/usr/bin/env bash
# One-time Keycloak setup: realm "chimera", confidential client "chimera-web"
# (secret taken from .env) and a demo user.
#   ./setup-keycloak.sh <demo-password>
set -euo pipefail
cd "$(dirname "$0")"

DEMO_PW="${1:?usage: ./setup-keycloak.sh <demo-password>}"
val() { grep "^$1=" .env | cut -d= -f2-; }
APP_HOST=$(val APP_HOST)
ADMIN_PW=$(val KEYCLOAK_ADMIN_PASSWORD)
CLIENT_SECRET=$(val KEYCLOAK_CLIENT_SECRET)

kc() { docker compose exec -T keycloak /opt/keycloak/bin/kcadm.sh "$@"; }

kc config credentials --server http://localhost:8080 --realm master --user admin --password "$ADMIN_PW" >/dev/null
kc create realms -s realm=chimera -s enabled=true -s registrationAllowed=true \
  -s loginWithEmailAllowed=true -s loginTheme=chimera -s emailTheme=chimera
kc create clients -r chimera -s clientId=chimera-web -s enabled=true -s publicClient=false \
  -s secret="$CLIENT_SECRET" -s standardFlowEnabled=true -s directAccessGrantsEnabled=true \
  -s "redirectUris=[\"https://${APP_HOST}/*\"]" -s "webOrigins=[\"https://${APP_HOST}\"]" \
  -s "attributes={\"post.logout.redirect.uris\":\"https://${APP_HOST}/*\"}"
kc create users -r chimera -s username=demo -s email=demo@inktide.local -s emailVerified=true \
  -s enabled=true -s firstName=Demo -s lastName=Streamer
kc set-password -r chimera --username demo --new-password "$DEMO_PW"
echo "keycloak configured for https://${APP_HOST}"
