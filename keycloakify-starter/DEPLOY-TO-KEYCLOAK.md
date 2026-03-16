# Развёртывание темы Chimera в Keycloak

> **Важно:** Keycloak 26.5 может выдавать ошибку `locale is null` в template.ftl.
> Рекомендуется использовать **Keycloak 25** для стабильной работы с Keycloakify.

## 1. Сборка темы

```bash
cd keycloakify-starter
npm run build-keycloak-theme
```

После сборки JAR-файлы появятся в папке `dist_keycloak/`:

- **Keycloak 11–21, 26+** → `keycloak-theme-for-kc-all-other-versions.jar`
- **Keycloak 22–25** → `keycloak-theme-for-kc-22-to-25.jar`

## 2. Установка в Keycloak

### Вариант A: Docker Compose + PostgreSQL (рекомендуется для Mac)

На Mac встроенная БД H2 теряет пользователя admin после рестарта (`user_not_found`). PostgreSQL решает эту проблему.

```bash
# 1. Собери тему и скопируй JAR
cd keycloakify-starter && npm run build-keycloak-theme && cd ..
mkdir -p themes
cp keycloakify-starter/dist_keycloak/keycloak-theme-for-kc-22-to-25.jar themes/

# 2. Запуск Keycloak + PostgreSQL
docker compose -f docker-compose.keycloak.yml up -d

# Подожди ~45 сек (PostgreSQL + Keycloak), затем http://localhost:8080/admin
```

### Вариант A2: Docker run (H2 — может терять admin на Mac после рестарта)

```bash
mkdir -p themes
cp keycloakify-starter/dist_keycloak/keycloak-theme-for-kc-22-to-25.jar themes/

docker stop keycloak 2>/dev/null; docker rm keycloak 2>/dev/null
docker run -d --name keycloak \
  -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  -v $(pwd)/themes:/opt/keycloak/providers \
  -v keycloak_data:/opt/keycloak/data \
  quay.io/keycloak/keycloak:25.0.6 start-dev
```

### Вариант B: Docker Compose

Структура:

```
./docker-compose.yaml
./themes/keycloak-theme-for-kc-all-other-versions.jar
```

```yaml
services:
  keycloak:
    image: quay.io/keycloak/keycloak:26
    command: start-dev
    environment:
      KC_HOSTNAME: localhost
      KC_HTTP_ENABLED: true
      KC_DB: dev-file
    ports:
      - 8080:8080
    volumes:
      - ./themes:/opt/keycloak/providers
```

### Вариант C: Bare metal (без Docker)

1. Скопируй JAR в `/opt/keycloak/providers/` (или в каталог providers твоего Keycloak)
2. Выполни: `bin/kc.sh build`
3. Запусти Keycloak

## 3. Включение темы в Keycloak Admin Console

1. Открой **http://localhost:8080** (или адрес твоего Keycloak)
2. Войди как **admin**
3. Создай realm (если ещё нет) — **не используй master** для приложений
4. **Realm Settings** → вкладка **Themes**
5. В **Login theme** выбери **keycloakify-starter**
6. Нажми **Save**

### Тема для конкретного клиента

1. **Clients** → выбери нужный клиент
2. В **Login theme** выбери **keycloakify-starter**
3. **Save**

## 4. Чеклист настройки (admin → realm → client → user)

После первого входа admin/admin:

1. **Realm** → Create realm → `chimera-app-realm`
2. **Client** → Create client → `chimera-app-agent`
3. **Users** → Add user:
   - Username: `scarletsurge.86@gmail.com`
   - Email: `scarletsurge.86@gmail.com`
   - First name: `scarletsurge`
   - Last name: `scarletsurge`
   - Email verified: ✓
4. **Credentials** → Set password: `Idol6566SecondJinn8824505` (без Temporary)
5. **Realm Settings** → Themes → Login theme: `keycloakify-starter` → Save
6. **Restart**: `docker restart keycloak` — данные сохранятся (volume `keycloak_data`)

> ⚠️ На Mac H2 теряет admin после рестарта (`user_not_found` в логах). Используй **docker-compose.keycloak.yml** с PostgreSQL.

## 5. Проверка

Открой страницу логина твоего приложения — должна отображаться тема Chimera.
