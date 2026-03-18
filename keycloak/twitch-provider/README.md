# Keycloak Twitch Identity Provider

Провайдер Twitch для Keycloak 25. Исправляет ошибку десериализации, когда Twitch возвращает `scope` как массив вместо строки.

## Сборка

```bash
mvn clean package -DskipTests
```

JAR: `target/keycloak-twitch-provider-1.0.0.jar`

## Установка

### Вариант A: Монтирование (start-dev)

Текущий `docker-compose.keycloak.yml` монтирует `./themes` в `/opt/keycloak/providers`.

1. Создать `themes/` в корне проекта (если нет) и скопировать JAR:
   ```bash
   # из корня chimera:
   mkdir -p themes
   cp keycloak/twitch-provider/target/keycloak-twitch-provider-1.0.0.jar themes/
   ```

2. Перезапустить Keycloak:
   ```bash
   docker compose -f docker-compose.keycloak.yml restart keycloak
   ```

**Примечание:** В dev-режиме (`start-dev`) провайдеры могут подхватываться без `kc.sh build`. Если Twitch не появляется в списке — используй Вариант B.

### Вариант B: Сборка кастомного образа

1. Собрать JAR: `mvn clean package -DskipTests`
2. Собрать образ:
   ```bash
   docker build -t keycloak-twitch:25 .
   ```
3. В `docker-compose.keycloak.yml` заменить образ:
   ```yaml
   keycloak:
     image: keycloak-twitch:25
     command: start-dev
     # ... остальное без изменений
   ```
4. Запустить: `docker compose -f docker-compose.keycloak.yml up -d`

## Настройка в Keycloak

1. Keycloak Admin → **Identity Providers** → **Add provider**
2. Выбрать **Twitch** (появится в списке после установки)
3. **Alias**: `twitch`
4. **Client ID** — из [Twitch Developer Console](https://dev.twitch.tv/console)
5. **Client Secret** — из Twitch Console
6. Сохранить

## Redirect URL в Twitch Console

В Twitch Developer Console → Redirect URLs добавить:

```
http://localhost:8080/realms/<realm>/broker/twitch/endpoint
```

Например для realm `chimera-app`:

```
http://localhost:8080/realms/chimera-app/broker/twitch/endpoint
```
