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
    #region Fields

    private const string CorsPolicyName = "ChimeraPolicy";

    #endregion

    #region Public Methods

    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        var keycloakSection = ctx.Configuration.GetSection("KeycloakSettings");
        services.Configure<KeycloakSettings>(keycloakSection);

        var keycloak = keycloakSection.Get<KeycloakSettings>() ?? new KeycloakSettings();

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Authority = keycloak.Authority;
                options.RequireHttpsMetadata = keycloak.RequireHttpsMetadata;

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

        var corsSection = ctx.Configuration.GetSection("Cors");
        services.Configure<CorsSettings>(corsSection);

        var cors = corsSection.Get<CorsSettings>() ?? new CorsSettings();

        services.AddCors(options =>
        {
            options.AddPolicy(CorsPolicyName, builder =>
            {
                if (cors.AllowedOrigins.Length > 0)
                {
                    builder.WithOrigins(cors.AllowedOrigins);
                }
                else
                {
                    builder.AllowAnyOrigin();
                }

                builder
                    .AllowAnyMethod()
                    .AllowAnyHeader();

                if (cors.AllowedOrigins.Length > 0)
                {
                    builder.AllowCredentials();
                }
            });
        });
    }

    #endregion

    #region Private Methods

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

    #endregion
}
