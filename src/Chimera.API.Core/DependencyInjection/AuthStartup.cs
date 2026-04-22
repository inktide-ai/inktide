using System.Linq;
using System.Security.Claims;
using Chimera.API.Core.Settings;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;

namespace Chimera.API.Core.DependencyInjection;

/// <summary>
/// Registers Keycloak JWT Bearer authentication, authorization, and CORS services.
/// Discovered automatically by the module system via <see cref="IStartup"/>.
/// </summary>
public sealed class AuthStartup : IStartup
{

    private const string CorsPolicyName = "ChimeraPolicy";


    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        var keycloakSection = ctx.Configuration.GetSection(nameof(KeycloakSettings));
        services.Configure<KeycloakSettings>(keycloakSection);

        var keycloak = keycloakSection.Get<KeycloakSettings>() ?? new KeycloakSettings();

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
                    ValidateAudience = !string.IsNullOrWhiteSpace(keycloak.Audience),
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
                else
                {
                    builder.AllowAnyOrigin()
                           .AllowAnyMethod()
                           .AllowAnyHeader();
                }
            });
        });
    }


    /// <summary>
    /// Keycloak puts the user ID in the "sub" claim. ASP.NET Core expects
    /// <see cref="ClaimTypes.NameIdentifier"/> for <c>User.FindFirstValue</c>.
    /// This maps "sub" → NameIdentifier so controllers work seamlessly.
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
