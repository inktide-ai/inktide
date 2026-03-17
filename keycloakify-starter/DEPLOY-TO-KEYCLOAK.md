# Deploying Chimera Theme to Keycloak

> **Important:** Keycloak 26.5 may throw `locale is null` in template.ftl.
> Use **Keycloak 25** for stable Keycloakify compatibility.
>
> **Production:** change admin password, configure SMTP, Frontend URL, and SSL.

## 1. Build the theme

```bash
cd keycloakify-starter
npm run build-keycloak-theme
```

JAR files will appear in `dist_keycloak/`:

- **Keycloak 11–21, 26+** → `keycloak-theme-for-kc-all-other-versions.jar`
- **Keycloak 22–25** → `keycloak-theme-for-kc-22-to-25.jar`

## 2. Install in Keycloak

### Option A: Docker Compose + PostgreSQL (recommended for Mac)

On Mac, the built-in H2 database loses the admin user after restart (`user_not_found`). PostgreSQL fixes this.

```bash
# 1. Build theme and copy JAR
cd keycloakify-starter && npm run build-keycloak-theme && cd ..
mkdir -p themes
cp keycloakify-starter/dist_keycloak/keycloak-theme-for-kc-22-to-25.jar themes/

# 2. Start Keycloak + PostgreSQL
docker compose -f docker-compose.keycloak.yml up -d

# Wait ~45 sec (PostgreSQL + Keycloak), then http://localhost:8080/admin
```

### Option A2: Docker run (H2 — may lose admin on Mac after restart)

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

### Option B: Docker Compose

Structure:

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

### Option C: Bare metal (no Docker)

1. Copy JAR to `/opt/keycloak/providers/` (or your Keycloak providers directory)
2. Run: `bin/kc.sh build`
3. Start Keycloak

## 3. Enable theme in Keycloak Admin Console

1. Open **http://localhost:8080** (or your Keycloak URL)
2. Log in as **admin**
3. Create a realm (if needed) — **do not use master** for applications
4. **Realm Settings** → **Themes** tab
5. Set **Login theme** to **keycloakify-starter**
6. Set **Email theme** to **keycloakify-starter** (for Chimera-styled emails)
7. Click **Save**

### Theme for a specific client

1. **Clients** → select the client
2. Set **Login theme** to **keycloakify-starter**
3. **Save**

## 4. Theme pages

- **Login** — Chimera-styled login (username/password, Google, Twitch)
- **Register** — Chimera-styled registration (100% match from apps/web)
- **Forgot Password** — Chimera-styled reset password
- **Verify Email** — Chimera-styled "Check your email" page
- **Email theme** — Chimera-styled emails (password reset, verification) — dark theme, red buttons

## 5. Setup checklist (admin → realm → client → user)

After first login as admin/admin:

1. **Realm** → Create realm (e.g. `chimera-app-realm`)
2. **Client** → Create client (e.g. `chimera-app-agent`)
3. **Users** → Add user (username, email, first/last name, Email verified: ✓)
4. **Credentials** → Set password (without Temporary)
5. **Realm Settings** → Themes → Login theme: `keycloakify-starter`, Email theme: `keycloakify-starter` → Save
6. **Restart**: `docker restart keycloak` — data persists (volume `keycloak_data`)

> ⚠️ On Mac, H2 loses admin after restart (`user_not_found` in logs). Use **docker-compose.keycloak.yml** with PostgreSQL.

## 6. Email links (Reset Password, Verify Email)

If the link in the email does not work:

1. **Frontend URL** — Keycloak generates links from `KC_HOSTNAME` (localhost by default). If the email is opened on another device (phone, different PC), `localhost` will not work.
   - **Realm Settings** → **General** → **Frontend URL**: set a public URL, e.g. `http://192.168.1.100:8080` (local network) or `https://keycloak.your-domain.com` (production).
2. **Email theme** — the link is inserted directly in the template (without `kcSanitize`) to avoid URL corruption — known Keycloak issue.

## 7. Verify

Open your application login page — the Chimera theme should be displayed.
