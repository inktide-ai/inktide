# OAuth Integration Analysis — Chimera Identity API

## Current Architecture

### Layers
- **Domain**: `User` entity, `IUserRepository`
- **Application**: `IAuthService`, `AuthService`, `TokenService`, `IPasswordHasher`
- **Infrastructure**: `UserRepository`, `IdentifyDbContext`, JWT Bearer auth, Redis refresh tokens
- **REST**: `AuthController` (register, login, refresh, logout, forgot-password)

### Auth Flow
- **Register**: Create user with email + password hash → issue JWT + refresh token
- **Login**: API key OR email/password → verify → issue tokens
- **Refresh**: Consume refresh token → issue new pair
- **Logout**: Revoke refresh token

### User Model
- `Id`, `Email`, `PasswordHash`, `DisplayName`, `Role`, `IsActive`, `CreatedAt`, `UpdatedAt`
- `PasswordHash` is required (NOT NULL)

### DI
- **DryIoc** for app services
- **MS DI** for ASP.NET Core (Auth, DbContext, etc.)
- **InfrastructureStartup** configures `AddAuthentication(JwtBearer)` + `AddJwtBearer`

---

## OAuth 2.0 Flow (Authorization Code)

1. **Challenge**: User clicks "Sign in with Google" → frontend redirects to `GET /api/auth/google`
2. **Redirect**: Backend returns 302 to Google/Twitch authorization URL
3. **Callback**: User authorizes → provider redirects to our callback with `?code=...&state=...`
4. **Token exchange**: Backend exchanges `code` for access token
5. **User info**: Backend fetches user profile (email, name) from provider
6. **Find or create**: Look up by `google_id`/`twitch_id` → else by email (link) → else create
7. **Issue session**: Same `IssueSessionAsync` as password login → return tokens

---

## Design Decisions

### 1. User storage for OAuth
- Add `google_id` (nullable) and `twitch_id` (nullable) to `users`
- OAuth users: `password_hash` = BCrypt hash of random value (never used for login)
- Account linking: if user exists by email but provider_id is null → update provider_id and login

### 2. Authentication schemes
- Keep `JwtBearer` as default for API
- Add `Google` and `Twitch` schemes for OAuth challenge/callback
- OAuth callback uses `[Authorize(AuthenticationSchemes = "Google")]` etc.

### 3. Callback response
- **Option A**: Redirect to SPA with tokens in URL fragment (e.g. `/#access_token=...&refresh_token=...`)
- **Option B**: Redirect to SPA with `?code=...` (backend-issued one-time code) → SPA exchanges for tokens
- **Option C**: Set HTTP-only cookies

For SPA + JWT in localStorage: **Option A** is common. Frontend reads `window.location.hash` and stores tokens.

### 4. State parameter
- Required for CSRF protection
- ASP.NET Core's OAuth middleware handles this automatically

---

## Implementation Plan

1. **Domain**: Add `GoogleId`, `TwitchId` to `User`
2. **Infrastructure**: Migration, `UserConfiguration`, `IUserRepository` extensions
3. **Application**: `IExternalAuthService`, `ExternalAuthService` (or extend `IAuthService`)
4. **Settings**: `OAuthSettings` (Google/Twitch ClientId, ClientSecret, CallbackPath)
5. **Infrastructure**: `AddGoogle()`, `AddOAuth("Twitch")` in `InfrastructureStartup`
6. **REST**: `AuthController` endpoints: `GET /api/auth/google`, `GET /api/auth/google/callback`, same for Twitch

---

## Setup

### 1. Google Cloud Console
- Create OAuth 2.0 credentials (Web application)
- Authorized redirect URI: `https://your-api-domain/api/auth/google/callback`
- Copy Client ID and Client Secret to `OAuthSettings:Google`

### 2. Twitch Developer Console
- Register application at https://dev.twitch.tv/console
- Add redirect URI: `https://your-api-domain/api/auth/twitch/callback`
- Copy Client ID and Client Secret to `OAuthSettings:Twitch`

### 3. appsettings / User Secrets
```json
"OAuthSettings": {
  "FrontendBaseUrl": "https://app.chimera.ai",
  "FrontendCallbackPath": "/auth/callback",
  "Google": {
    "Enabled": true,
    "ClientId": "...",
    "ClientSecret": "..."
  },
  "Twitch": {
    "Enabled": true,
    "ClientId": "...",
    "ClientSecret": "..."
  }
}
```

### 4. Migration
```bash
dotnet ef database update --project src/Chimera.API.Identify/Chimera.API.Identify.Infrastructure --startup-project src/Chimera.API
```

### 5. Frontend
- Redirect to `GET /api/auth/google` or `GET /api/auth/twitch` (with optional `?returnUrl=...`)
- Create `/auth/callback` page that reads `window.location.hash` for `access_token`, `refresh_token`, `expires_in` and stores them

---

## Twitch OAuth Endpoints

- **Authorization**: `https://id.twitch.tv/oauth2/authorize`
- **Token**: `https://id.twitch.tv/oauth2/token`
- **User info**: `https://api.twitch.tv/helix/users` (requires `Bearer` token)

---

## Google OAuth

- Uses `Microsoft.AspNetCore.Authentication.Google` — built-in
- Scopes: `email`, `profile` (openid)
