#!/bin/bash
# Start Keycloak with Chimera theme (PostgreSQL — reliable on Mac)
# Run from chimera root: ./keycloak/theme/start-keycloak.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# themes folder with JAR
mkdir -p themes
if [ ! -f themes/keycloak-theme-for-kc-22-to-25.jar ]; then
    echo "Copy JAR first: cp keycloak/theme/dist_keycloak/keycloak-theme-for-kc-22-to-25.jar themes/"
    exit 1
fi

# Stop existing containers
docker compose -f docker-compose.keycloak.yml down 2>/dev/null || true
docker stop keycloak 2>/dev/null || true
docker rm keycloak 2>/dev/null || true

echo "Starting Keycloak + PostgreSQL (data persists on restart)..."
docker compose -f docker-compose.keycloak.yml up -d

echo ""
echo "Wait ~45 sec, then:"
echo "  1. http://localhost:8080/admin — log in as admin / admin"
echo "  2. Create realm, client, user, set theme"
echo "  3. docker compose -f docker-compose.keycloak.yml restart keycloak — admin will persist"
echo ""
