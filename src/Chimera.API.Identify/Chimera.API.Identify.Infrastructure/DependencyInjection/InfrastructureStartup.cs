using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.OAuth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Chimera.API.Core;
using Chimera.API.Core.Settings;
using Chimera.API.Core.Settings.Validators;
using Chimera.API.Identify.Application.Interfaces.Auth;
using Chimera.API.Identify.Application.Models.Auth;
using Chimera.API.Identify.Application.Settings;
using Chimera.API.Identify.Application.Settings.Validators;
using Chimera.API.Identify.Infrastructure.DbContext;
using Chimera.API.Identify.Infrastructure.Settings;

namespace Chimera.API.Identify.Infrastructure.DependencyInjection;

/// <summary>Infrastructure startup — registers DbContext and health checks.</summary>
public sealed class InfrastructureStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        var postgresConnectionString = ResolveConnectionString(ctx.Configuration);

        var redisSettings = new RedisSettings();
        ctx.Configuration.GetSection(nameof(RedisSettings)).Bind(redisSettings);

        services.AddDbContext<IdentifyDbContext>(
            options => {
                options.UseNpgsql(postgresConnectionString);
            });

        services.AddOptions<SmtpSettings>()
            .BindConfiguration(nameof(SmtpSettings));

        services.AddOptions<AppSettings>()
            .BindConfiguration(nameof(AppSettings));

        services.AddOptions<AuthSettings>()
            .BindConfiguration(nameof(AuthSettings))
            .ValidateOnStart();

        services.AddSingleton<IValidateOptions<AuthSettings>, AuthSettingsValidator>();

        services.AddOptions<OAuthSettings>()
            .BindConfiguration(nameof(OAuthSettings));

        services.AddOptions<RedisSettings>()
            .BindConfiguration(nameof(RedisSettings))
            .ValidateOnStart();

        services.AddSingleton<IValidateOptions<RedisSettings>, RedisSettingsValidator>();

        services
            .AddHealthChecks()
            .AddNpgSql(postgresConnectionString, name: "postgres", failureStatus: HealthStatus.Unhealthy)
            .AddRedis(redisSettings.ToConnectionString(), name: "redis", failureStatus: HealthStatus.Unhealthy);

        services.AddAuthorization();

        var authSettings = ctx.Configuration.GetSection(nameof(AuthSettings)).Get<AuthSettings>() ?? new AuthSettings();
        var oauthSettings = ctx.Configuration.GetSection(nameof(OAuthSettings)).Get<OAuthSettings>() ?? new OAuthSettings();

        var authBuilder = services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(authSettings.Secret)),
                    ValidIssuer = authSettings.Issuer,
                    ValidAudience = authSettings.Audience,
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(5)
                };
            });

        if (oauthSettings.Google.Enabled && !string.IsNullOrEmpty(oauthSettings.Google.ClientId))
        {
            authBuilder.AddGoogle(GoogleDefaults.AuthenticationScheme, options =>
            {
                options.ClientId = oauthSettings.Google.ClientId;
                options.ClientSecret = oauthSettings.Google.ClientSecret;
                options.CallbackPath = "/api/auth/google/callback";
                options.Events.OnCreatingTicket = CreateOAuthTicketHandler(oauthSettings, isGoogle: true);
            });
        }

        if (oauthSettings.Twitch.Enabled && !string.IsNullOrEmpty(oauthSettings.Twitch.ClientId))
        {
            authBuilder.AddOAuth("Twitch", options =>
            {
                options.ClientId = oauthSettings.Twitch.ClientId;
                options.ClientSecret = oauthSettings.Twitch.ClientSecret;
                options.CallbackPath = "/api/auth/twitch/callback";
                options.AuthorizationEndpoint = "https://id.twitch.tv/oauth2/authorize";
                options.TokenEndpoint = "https://id.twitch.tv/oauth2/token";
                options.Scope.Add("user:read:email");
                options.Events = new OAuthEvents
                {
                    OnCreatingTicket = async context =>
                    {
                        var request = new HttpRequestMessage(HttpMethod.Get, "https://api.twitch.tv/helix/users");
                        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", context.AccessToken);
                        request.Headers.Add("Client-Id", oauthSettings.Twitch.ClientId);
                        var response = await context.Backchannel.SendAsync(request, context.HttpContext.RequestAborted);
                        response.EnsureSuccessStatusCode();
                        var json = await response.Content.ReadAsStringAsync(context.HttpContext.RequestAborted);
                        using var doc = JsonDocument.Parse(json);
                        var data = doc.RootElement.GetProperty("data")[0];
                        var id = data.GetProperty("id").GetString() ?? "";
                        var email = data.TryGetProperty("email", out var e) ? e.GetString() ?? "" : "";
                        var displayName = data.TryGetProperty("display_name", out var d) ? d.GetString() : null;
                        context.Identity?.AddClaim(new Claim(ClaimTypes.NameIdentifier, id));
                        context.Identity?.AddClaim(new Claim(ClaimTypes.Email, email));
                        if (!string.IsNullOrEmpty(displayName))
                            context.Identity?.AddClaim(new Claim(ClaimTypes.Name, displayName));
                        await CompleteOAuthAndRedirect(context, oauthSettings, id, email, displayName, isGoogle: false);
                    }
                };
            });
        }
    }

    private static Func<Microsoft.AspNetCore.Authentication.OAuth.OAuthCreatingTicketContext, Task> CreateOAuthTicketHandler(
        OAuthSettings oauthSettings, bool isGoogle)
    {
        return async context =>
        {
            var sub = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
            var email = context.Principal?.FindFirstValue(ClaimTypes.Email) ?? "";
            var name = context.Principal?.FindFirstValue(ClaimTypes.Name);
            await CompleteOAuthAndRedirect(context, oauthSettings, sub, email, name, isGoogle);
        };
    }

    private static async Task CompleteOAuthAndRedirect(
        Microsoft.AspNetCore.Authentication.OAuth.OAuthCreatingTicketContext context,
        OAuthSettings oauthSettings,
        string providerId,
        string email,
        string? displayName,
        bool isGoogle)
    {
        var returnUrl = (context.Properties.Items.TryGetValue("returnUrl", out var url) ? url : null)
            ?? oauthSettings.FrontendBaseUrl.TrimEnd('/') + oauthSettings.FrontendCallbackPath;
        var externalAuth = context.HttpContext.RequestServices.GetRequiredService<IExternalAuthService>();
        AuthResult result = isGoogle
            ? await externalAuth.AuthenticateGoogleAsync(providerId, email, displayName, context.HttpContext.RequestAborted)
            : await externalAuth.AuthenticateTwitchAsync(providerId, email, displayName, context.HttpContext.RequestAborted);
        var redirect = $"{returnUrl}#access_token={Uri.EscapeDataString(result.AccessToken)}&refresh_token={Uri.EscapeDataString(result.RefreshToken ?? "")}&expires_in={result.ExpiresIn}";
        context.Response.Redirect(redirect);
        context.NoResult();
    }

    private static string ResolveConnectionString(IConfiguration configuration)
    {
        var fullOverride = configuration.GetConnectionString("Postgres");
        if (!string.IsNullOrWhiteSpace(fullOverride))
        {
            return fullOverride.Trim();
        }

        var settings = new PostgresSettings();
        configuration.GetSection(nameof(PostgresSettings)).Bind(settings);

        if (string.IsNullOrEmpty(settings.Password))
        {
            settings.Password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? string.Empty;
        }

        if (string.IsNullOrEmpty(settings.Password))
        {
            throw new InvalidOperationException(
                "PostgreSQL password is not configured. Set PostgresSettings:Password, " +
                "POSTGRES_PASSWORD, or ConnectionStrings:Postgres.");
        }

        return settings.ToConnectionString();
    }
}
