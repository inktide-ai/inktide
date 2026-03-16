#!/bin/bash
# Запуск Keycloak с темой Chimera (PostgreSQL — надёжно на Mac)
# Запускать из корня chimera: ./keycloakify-starter/start-keycloak.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Папка themes с JAR
mkdir -p themes
if [ ! -f themes/keycloak-theme-for-kc-22-to-25.jar ]; then
    echo "Скопируй JAR: cp keycloakify-starter/dist_keycloak/keycloak-theme-for-kc-22-to-25.jar themes/"
    exit 1
fi

# Остановить старые контейнеры
docker compose -f docker-compose.keycloak.yml down 2>/dev/null || true
docker stop keycloak 2>/dev/null || true
docker rm keycloak 2>/dev/null || true

echo "Запуск Keycloak + PostgreSQL (данные сохранятся при перезапуске)..."
docker compose -f docker-compose.keycloak.yml up -d

echo ""
echo "Подожди ~45 сек, затем:"
echo "  1. http://localhost:8080/admin — войди admin / admin"
echo "  2. Создай realm, client, user, поставь тему"
echo "  3. docker compose -f docker-compose.keycloak.yml restart keycloak — admin не пропадёт"
echo ""
