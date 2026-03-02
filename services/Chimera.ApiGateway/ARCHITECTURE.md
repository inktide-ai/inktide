# Chimera API Gateway — Architecture

## Overview

The gateway is a modular ASP.NET Core host that composes optional modules (REST API, gRPC, Twitch, Discord, Infrastructure) via configuration. It uses **DryIoc** as the root container and **MS DI** for ASP.NET Core built-in services.

## Boot Sequence

1. **Program.Main** — Builds configuration, configures Serilog, builds the host via `Startup.CreateHostBuilder()`, resolves `App` from DryIoc, calls `App.Start()` (runs the web host).
2. **Host build** (in `Startup.CreateHostBuilder`):
   - **ConfigureAppConfiguration** — Loads appsettings, binds `Modules`, loads enabled module assemblies via `Assembly.LoadFrom()`.
   - **Web host configurators** — All `IWebHostConfigurator` implementations are instantiated and called (e.g. REST Kestrel, gRPC Kestrel).
   - **Middleware configurators** — All `IMiddlewareConfigurator` implementations are called first (UseRouting, UseAuth, etc.).
   - **Endpoint configurators** — All `IEndpointConfigurator` implementations are called inside a single `UseEndpoints()` block (MapControllers, MapGrpcService, etc.). Order does not matter.
   - **ConfigureServices** — Host registers options, auth, authorization; then all `IStartup` implementations register services; then DryIoc container is created.
3. **Runtime** — Kestrel listens, hosted services (e.g. chat connectors, RabbitMQ publisher) run.

## Plugin Interfaces (Core)

| Interface | Purpose | When to implement |
|-----------|---------|-------------------|
| **IWebHostConfigurator** | Configure Kestrel (URLs, endpoints). | REST.API, Grpc — to add HTTP or HTTP/2 listeners. |
| **IMiddlewareConfigurator** | Configure the middleware pipeline (UseRouting, UseAuth, UseCors, etc.). Runs before endpoints. | REST.API — one implementation for the entire pipeline. |
| **IEndpointConfigurator** | Map endpoints (controllers, gRPC, health, metrics). All run inside a single `UseEndpoints()`. | REST.API (controllers, health, Prometheus), Grpc.Auth (gRPC services). Order-independent. |
| **IStartup** | Register services into `IServiceCollection` (MS DI). | Infrastructure, REST.API, Grpc, Twitch, Discord, Observability. |
| **IServiceRegistrator** | Register services into **DryIoc**. | Host (Redis), REST.API (WebHostConfigurator). |

- All plugin interfaces are discovered by scanning `AppDomain.CurrentDomain.GetAssemblies()` after module DLLs are loaded.
- The middleware/endpoint split guarantees correct pipeline order without relying on naming or explicit ordering.

## Projects (Layers)

| Project | Layer | Responsibility |
|---------|-------|----------------|
| Chimera.ApiGateway | Host | Program, Startup, module loading, DryIoc composition roots, appsettings. |
| Chimera.ApiGateway.Core | Shared | Plugin contracts (IStartup, IMiddlewareConfigurator, IEndpointConfigurator, IWebHostConfigurator, IServiceRegistrator), shared settings (AuthSettings, RedisSettings), logging formatter. |
| Chimera.ApiGateway.Domain | Domain | Entities, repository ports. |
| Chimera.ApiGateway.Application | Application | Auth/streaming interfaces, DTOs, AuthService, validators. |
| Chimera.ApiGateway.Infrastructure | Infrastructure | EF Core, Redis, RabbitMQ, health checks, OpenTelemetry. |
| Chimera.ApiGateway.REST.API | Presentation | Middleware (RestApiMiddlewareConfigurator), endpoints (RestApiEndpointConfigurator), services (RestApiStartup), controllers, WebHostConfigurator. |
| Chimera.ApiGateway.Grpc / Grpc.Auth / Grpc.Contracts | Presentation | gRPC server, auth service, endpoint configurator. |
| Chimera.ApiGateway.Twitch / Discord | Modules | Chat connectors, health checks, token providers. |

## Configuration

- **Modules** — `appsettings.json` → `Modules` section. Each entry: `AssemblyName`, `Enabled`. Only enabled assemblies are loaded.
- **Secrets** — Do not commit tokens (Discord `BotToken`, JWT `Auth:Secret`, etc.). Use User Secrets (development) or environment variables (production).
- **Auth** — `Auth:Secret` is required in non-Development (fail-fast). Demo login is gated by `Auth:EnableDemoLogin`.

## Adding a New Module

1. Create a project referencing Core (and optionally Application/Domain).
2. Implement one or more of: `IWebHostConfigurator`, `IMiddlewareConfigurator`, `IEndpointConfigurator`, `IStartup`, `IServiceRegistrator`.
3. Add the module to `Modules` in appsettings with `AssemblyName` and `Enabled: true`.
4. Ensure the host project references the new project so the DLL is copied to the output directory.
