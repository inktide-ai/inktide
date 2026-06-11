using System.Security.Cryptography;
using System.Text;
using Inktide.API.Developer.Application.Interfaces;
using Inktide.API.Developer.Application.Models;
using Inktide.API.Developer.Domain.Entities;
using Inktide.API.Developer.Domain.Enums;
using Inktide.API.Developer.Domain.Repositories;

namespace Inktide.API.Developer.Infrastructure.Services;

internal sealed class DeveloperAppService : IDeveloperAppService
{
    private readonly IDeveloperApplicationRepository _appRepo;
    private readonly IWebhookDeliveryRepository _deliveryRepo;
    private readonly IKeycloakClientService _keycloak;

    public DeveloperAppService(
        IDeveloperApplicationRepository appRepo,
        IWebhookDeliveryRepository deliveryRepo,
        IKeycloakClientService keycloak)
    {
        _appRepo      = appRepo      ?? throw new ArgumentNullException(nameof(appRepo));
        _deliveryRepo = deliveryRepo ?? throw new ArgumentNullException(nameof(deliveryRepo));
        _keycloak     = keycloak     ?? throw new ArgumentNullException(nameof(keycloak));
    }

    public async Task<ApplicationDto> CreateAsync(string ownerId, CreateApplicationCommand cmd, CancellationToken ct)
    {
        var (kcClientId, plainSecret) = await _keycloak.CreateClientAsync(cmd.Name, cmd.RedirectUris, ct);

        var secretHash = ToHex(SHA256.HashData(Encoding.UTF8.GetBytes(plainSecret)));
        string? webhookSecretHash = cmd.WebhookSecret is not null
            ? ToHex(SHA256.HashData(Encoding.UTF8.GetBytes(cmd.WebhookSecret)))
            : null;

        var app = DeveloperApplication.Create(
            ownerId, cmd.Name, cmd.Description, cmd.IconUrl,
            kcClientId, secretHash,
            cmd.RedirectUris, cmd.WebhookUrl, webhookSecretHash,
            cmd.Scopes);

        await _appRepo.AddAsync(app, ct);
        return ApplicationDto.From(app, plainSecret);
    }

    public async Task<IReadOnlyList<ApplicationDto>> GetByOwnerAsync(string ownerId, CancellationToken ct)
    {
        var apps = await _appRepo.GetByOwnerAsync(ownerId, ct);
        return apps.Select(a => ApplicationDto.From(a)).ToList();
    }

    public async Task<ApplicationDto?> GetByIdAsync(Guid id, string ownerId, CancellationToken ct)
    {
        var app = await _appRepo.FindByIdAsync(id, ct);
        if (app is null || app.OwnerUserId != ownerId) return null;
        return ApplicationDto.From(app);
    }

    public async Task<ApplicationDto> UpdateAsync(Guid id, string ownerId, UpdateApplicationCommand cmd, CancellationToken ct)
    {
        var app = await _appRepo.FindByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Application {id} not found.");
        if (app.OwnerUserId != ownerId)
            throw new UnauthorizedAccessException();

        string? webhookSecretHash = cmd.WebhookSecret is not null
            ? ToHex(SHA256.HashData(Encoding.UTF8.GetBytes(cmd.WebhookSecret)))
            : null;

        app.Update(cmd.Name, cmd.Description, cmd.IconUrl,
            cmd.RedirectUris, cmd.WebhookUrl, webhookSecretHash, cmd.Scopes);

        await _appRepo.UpdateAsync(app, ct);
        return ApplicationDto.From(app);
    }

    public async Task DeleteAsync(Guid id, string ownerId, CancellationToken ct)
    {
        var app = await _appRepo.FindByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Application {id} not found.");
        if (app.OwnerUserId != ownerId)
            throw new UnauthorizedAccessException();

        await _keycloak.DeleteClientAsync(app.KeycloakClientId, ct);
        await _appRepo.DeleteAsync(app, ct);
    }

    public async Task<ApplicationDto> RotateSecretAsync(Guid id, string ownerId, CancellationToken ct)
    {
        var app = await _appRepo.FindByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Application {id} not found.");
        if (app.OwnerUserId != ownerId)
            throw new UnauthorizedAccessException();

        var plainSecret = await _keycloak.RotateSecretAsync(app.KeycloakClientId, ct);
        var newHash = ToHex(SHA256.HashData(Encoding.UTF8.GetBytes(plainSecret)));
        app.RotateSecret(newHash);
        await _appRepo.UpdateAsync(app, ct);
        return ApplicationDto.From(app, plainSecret);
    }

    public async Task<AppInfoDto?> GetAppInfoAsync(
        string keycloakClientId, string? scopeString, string redirectUri, CancellationToken ct)
    {
        var app = await _appRepo.FindByKeycloakClientIdAsync(keycloakClientId, ct);
        if (app is null) return null;

        if (!app.RedirectUris.Any(u => MatchesRedirectUri(u, redirectUri)))
            return null;

        var requestedScopes = ParseScopes(scopeString)
            .Where(s => app.Scopes.Contains(s))
            .Select(s => new ScopeDescription(
                OAuthScopeDescriptions.ToScopeString(s),
                OAuthScopeDescriptions.Descriptions.TryGetValue(s, out var d) ? d : s.ToString()))
            .ToList();

        return new AppInfoDto(app.Name, app.IconUrl, "Inktide", requestedScopes);
    }

    public async Task<IReadOnlyList<WebhookDeliveryDto>> GetDeliveriesAsync(
        Guid appId, string ownerId, int page, int pageSize, CancellationToken ct)
    {
        var app = await _appRepo.FindByIdAsync(appId, ct);
        if (app is null || app.OwnerUserId != ownerId)
            throw new UnauthorizedAccessException();

        var deliveries = await _deliveryRepo.GetByApplicationAsync(appId, page, pageSize, ct);
        return deliveries.Select(WebhookDeliveryDto.From).ToList();
    }

    private static string ToHex(byte[] bytes) => Convert.ToHexString(bytes).ToLowerInvariant();

    private static IEnumerable<OAuthScope> ParseScopes(string? scopeString)
    {
        if (string.IsNullOrWhiteSpace(scopeString)) yield break;
        foreach (var s in scopeString.Split(' ', StringSplitOptions.RemoveEmptyEntries))
        {
            if (Enum.TryParse<OAuthScope>(s, ignoreCase: true, out var scope))
                yield return scope;
        }
    }

    private static bool MatchesRedirectUri(string allowed, string requested)
    {
        if (allowed == requested) return true;
        if (!allowed.EndsWith("*")) return false;
        var prefix = allowed[..^1];
        // Wildcard is only safe when the character before * is / — prevents matching sibling domains
        // e.g. "https://a.com/*" is safe; "https://a.com*" would match "https://a.com.evil.com/"
        if (!prefix.EndsWith('/')) return false;
        return requested.StartsWith(prefix, StringComparison.OrdinalIgnoreCase);
    }
}
