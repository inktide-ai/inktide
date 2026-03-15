# Identify: анализ Settings и зависимостей

## Текущее состояние

### Где что лежит

| Settings        | Проект        | Кто использует                          |
|-----------------|---------------|-----------------------------------------|
| **AuthSettings**| Application   | AuthService, TokenService, BCryptPasswordHasher, PasswordResetService |
| **AppSettings** | Infrastructure| PasswordResetService (Application!)     |
| **SmtpSettings**| Infrastructure| SmtpEmailSender (Infrastructure)         |
| **RedisSettings** | Infrastructure | InfrastructureStartup, RefreshTokenStore |
| **PostgresSettings** | Infrastructure | InfrastructureStartup |

### Проблема

**Application** зависит от **AppSettings** (PasswordResetService), но тип определён в **Infrastructure**.

Это нарушает направление зависимостей Clean Architecture:
```
Domain ← Application ← Infrastructure
```
Application не должен ссылаться на Infrastructure. Сейчас Application получает `IOptions<AppSettings>` — для этого ему нужен тип `AppSettings`. Если тип в Infrastructure, Application вынужден ссылаться на Infrastructure.

### Core — мёртвый проект

- `Chimera.API.Identify.Core` существует, но **пустой** (нет .cs файлов).
- `PasswordResetService` имеет `using Chimera.API.Identify.Core.Settings` — это **битая ссылка** (Core.Settings не существует).
- `SmtpEmailSender` имеет тот же using — не используется (SmtpSettings в Infrastructure).
- Скорее всего, Settings раньше были в Core, потом перенесены, но using'и не почистили.

---

## Решение

### 1. Перенести AppSettings в Application

**AppSettings** (FrontendBaseUrl, PasswordResetTokenMinutes) — это настройки для use case'ов (password reset email). Они относятся к Application.

```
Application/Settings/AppSettings.cs  ← перенести из Infrastructure
```

### 2. Регистрация остаётся в Infrastructure

Infrastructure уже ссылается на Application. Он регистрирует:
- `AddOptions<AppSettings>()` — тип будет из Application
- `AddOptions<AuthSettings>()` — уже из Application
- `AddOptions<SmtpSettings>()`, `AddOptions<RedisSettings>()` — свои

### 3. Удалить Identify.Core

- Удалить проект `Chimera.API.Identify.Core`
- Убрать ссылки из Application, Infrastructure, REST
- Убрать `using Chimera.API.Identify.Core.Settings` из PasswordResetService и SmtpEmailSender

### 4. PasswordResetService

Поменять:
```csharp
using Chimera.API.Identify.Core.Settings;  // удалить
```
на:
```csharp
using Chimera.API.Identify.Application.Settings;  // AppSettings уже есть рядом с AuthSettings
```

### 5. SmtpEmailSender

Удалить `using Chimera.API.Identify.Core.Settings` — не используется (только SmtpSettings из Infrastructure).

---

## Итоговая схема

```
Application/Settings/
├── AppSettings.cs
├── AuthSettings.cs
└── Validators/
    └── AuthSettingsValidator.cs

Infrastructure/Settings/
├── PostgresSettings.cs
├── RedisSettings.cs
├── SmtpSettings.cs
└── Validators/
    └── RedisSettingsValidator.cs
```

**Регистрация** (InfrastructureStartup):
- AppSettings, AuthSettings, AuthSettingsValidator — типы из Application
- SmtpSettings, RedisSettings, RedisSettingsValidator, PostgresSettings — типы из Infrastructure

**Направление зависимостей:** Domain ← Application ← Infrastructure ✓
