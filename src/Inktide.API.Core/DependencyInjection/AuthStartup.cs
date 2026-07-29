using System.Linq;
using System.Security.Claims;
using Inktide.API.Core.Settings;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;

namespace Inktide.API.Core.DependencyInjection;

/// <summary>
/// Registers Keycloak JWT Bearer authentication, authorization, and CORS services.
/// Discovered automatically by the module system via <see cref="IStartup"/>.
/// </summary>
public sealed class AuthStartup : IStartup
{

    private const string CorsPolicyName = "InktidePolicy";


    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        var keycloakSection = ctx.Configuration.GetSection(nameof(KeycloakSettings));
        services.Configure<KeycloakSettings>(keycloakSection);

        var keycloak = keycloakSection.Get<KeycloakSettings>() ?? new KeycloakSettings();

        if (string.IsNullOrWhiteSpace(keycloak.Audience))
            throw new InvalidOperationException(
                "KeycloakSettings.Audience must be configured. " +
                "Set via environment variable: KeycloakSettings__Audience=<client-id>");

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Authority = keycloak.Authority;
                options.RequireHttpsMetadata = keycloak.RequireHttpsMetadata;

                if (!string.IsNullOrWhiteSpace(keycloak.MetadataAddress))
                {
                    options.MetadataAddress = keycloak.MetadataAddress;

                    var publicOrigin = new Uri(keycloak.Authority).GetLeftPart(UriPartial.Authority);
                    var internalOrigin = new Uri(keycloak.MetadataAddress).GetLeftPart(UriPartial.Authority);

                    if (!string.Equals(publicOrigin, internalOrigin, StringComparison.OrdinalIgnoreCase))
                        options.BackchannelHttpHandler = new KeycloakUrlRewriteHandler(publicOrigin, internalOrigin);
                }

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = keycloak.Authority,
                    ValidateAudience = true,
                    ValidAudience = keycloak.Audience,
                    ValidateLifetime = true,
                    NameClaimType = "preferred_username",
                    RoleClaimType = "realm_access/roles",
                };

                options.Events = new JwtBearerEvents
                {
                    OnTokenValidated = context =>
                    {
                        MapKeycloakSubClaim(context);
                        return Task.CompletedTask;
                    },
                    // SignalR: browsers cannot set Authorization headers on WebSocket connections.
                    // Accepts either a full JWT or a short-lived ws-ticket (no dots) from Redis.
                    // Ticket path: Next.js POST /api/auth/ws-ticket -> Redis ws:ticket:{id} -> userId.
                    // StringGetDeleteAsync is atomic: single-use is guaranteed without a race.
                    OnMessageReceived = async context =>
                    {
                        var raw = context.Request.Query["access_token"].ToString();
                        if (string.IsNullOrEmpty(raw)) return;

                        var path = context.HttpContext.Request.Path;
                        if (!path.StartsWithSegments("/hubs")) return;

                        if (!raw.Contains('.'))
                        {
                            var db = context.HttpContext.RequestServices
                                .GetRequiredService<IConnectionMultiplexer>()
                                .GetDatabase();
                            var userId = await db.StringGetDeleteAsync($"ws:ticket:{raw}");
                            if (userId.IsNullOrEmpty) return;

                            var identity = new ClaimsIdentity(
                                [new Claim(ClaimTypes.NameIdentifier, userId.ToString())],
                                JwtBearerDefaults.AuthenticationScheme);
                            context.Principal = new ClaimsPrincipal(identity);
                            context.Success();
                            return;
                        }

                        context.Token = raw;
                    }
                };
            });

        services.AddAuthorization();

        var corsSection = ctx.Configuration.GetSection(nameof(CorsSettings));
        services.Configure<CorsSettings>(corsSection);

        var cors = corsSection.Get<CorsSettings>() ?? new CorsSettings();

        services.AddCors(options =>
        {
            options.AddPolicy(CorsPolicyName, builder =>
            {
                if (cors.AllowedOrigins.Length > 0)
                {
                    // Separate Tauri/custom-scheme origins from http(s) origins.
                    // AllowCredentials() is only valid with http(s) origins; non-standard
                    // schemes (tauri://) must be listed separately without it.
                    // Bearer-token auth does not need AllowCredentials (that's for cookies).
                    var standardOrigins = cors.AllowedOrigins
                        .Where(o => o.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                                 || o.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                        .ToArray();

                    var customOrigins = cors.AllowedOrigins
                        .Except(standardOrigins, StringComparer.OrdinalIgnoreCase)
                        .ToArray();

                    var allOrigins = cors.AllowedOrigins;
                    builder.WithOrigins(allOrigins)
                           .AllowAnyMethod()
                           .AllowAnyHeader();

                    // Only add AllowCredentials for standard-scheme origins
                    if (standardOrigins.Length > 0 && customOrigins.Length == 0)
                    {
                        builder.AllowCredentials();
                    }
                }
                else if (!ctx.HostingEnvironment.IsProduction())
                {
                    // Development/staging only: allow all origins when no list is configured.
                    // In production, AllowedOrigins must be explicitly set (validated below).
                    builder.AllowAnyOrigin()
                           .AllowAnyMethod()
                           .AllowAnyHeader();
                }
            });
        });

        if (ctx.HostingEnvironment.IsProduction() && cors.AllowedOrigins.Length == 0)
            throw new InvalidOperationException(
                "CorsSettings.AllowedOrigins must be configured in production. " +
                "Set via environment variable: CorsSettings__AllowedOrigins__0=https://your-domain.com");
    }


    /// <summary>
    /// Keycloak puts the user ID in the "sub" claim. ASP.NET Core expects
    /// <see cref="ClaimTypes.NameIdentifier"/> for <c>User.FindFirstValue</c>.
    /// This maps "sub" -> NameIdentifier so controllers work seamlessly.
    /// </summary>
    private static void MapKeycloakSubClaim(TokenValidatedContext context)
    {
        if (context.Principal?.Identity is not ClaimsIdentity identity)
            return;

        var sub = identity.FindFirst("sub")?.Value;
        if (sub is null)
            return;

        if (!identity.HasClaim(ClaimTypes.NameIdentifier, sub))
        {
            identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, sub));
        }
    }

}
