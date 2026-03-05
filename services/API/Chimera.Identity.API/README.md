# Chimera.Identity.API

Self-contained Identity service extracted from Chimera.ApiGateway. Provides JWT authentication, user registration, refresh tokens, and password reset.

## Structure

- **Chimera.Identity.API** — Host project (Program.cs, appsettings.json)
- **Chimera.Identity.Domain** — User entity, IUserRepository
- **Chimera.Identity.Application** — IAuthService, AuthService, ITokenService, IPasswordHasher, PasswordResetService
- **Chimera.Identity.Infrastructure** — IdentityDbContext, UserRepository, RefreshTokenStore, PasswordResetStore, Redis, Postgres, SMTP
- **Chimera.Identity.Api** — REST API (AuthController, MeController, validators, converters, models)

## Prerequisites

- .NET 8 SDK
- PostgreSQL (database: `chimera_identity`, schema: `identity`)
- Redis
- SMTP server (e.g. MailHog on port 1025 for local dev)

## Configuration

1. **JWT Secret** (required, min 32 chars):
   ```bash
   dotnet user-secrets set "AuthSettings:Secret" "your-super-secret-key-at-least-32-characters-long"
   ```

2. **PostgreSQL** — Set `PostgresSettings:Password` or `POSTGRES_PASSWORD` env var.

3. See `.env.example` for other options.

## Run

```bash
cd services/Chimera.Identity.API
dotnet run --project Chimera.Identity.API
```

- API: http://127.0.0.1:8082
- Swagger: http://127.0.0.1:8082/swagger
- Health: http://127.0.0.1:8082/health

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login (API key or email+password) |
| POST | /api/auth/refresh | Refresh tokens |
| POST | /api/auth/logout | Revoke refresh token |
| POST | /api/auth/forgot-password | Request password reset email |
| POST | /api/auth/reset-password | Reset password with token |
| GET | /api/me | Current user (requires JWT) |
