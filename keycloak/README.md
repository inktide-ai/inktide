# Keycloak integrations

Интеграции с Keycloak для Chimera.

## Структура

| Папка | Описание |
|-------|----------|
| **theme/** | Keycloakify-тема (Login, Register, Email) — React + Vite |
| **twitch-provider/** | Identity Provider для Twitch (исправляет scope array) |

## Theme

```bash
cd theme
npm install
npm run build-keycloak-theme
```

JAR → `dist_keycloak/` → скопировать в `themes/` в корне проекта.

## Twitch Provider

```bash
cd twitch-provider
mvn clean package -DskipTests
```

JAR → `twitch-provider/target/keycloak-twitch-provider-1.0.0.jar`

Копирование (из корня chimera):
```bash
mkdir -p themes
cp keycloak/twitch-provider/target/keycloak-twitch-provider-1.0.0.jar themes/
```

## Общая папка providers

`themes/` в корне монтируется в Keycloak как `/opt/keycloak/providers/`. Туда кладутся:

- `keycloak-theme-for-kc-22-to-25.jar` (из theme)
- `keycloak-twitch-provider-1.0.0.jar` (из twitch-provider)
