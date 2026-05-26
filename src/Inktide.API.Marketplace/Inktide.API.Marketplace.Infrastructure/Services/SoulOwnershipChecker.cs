using System.Net;
using System.Net.Http.Headers;
using Inktide.API.Marketplace.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Marketplace.Infrastructure.Services;

/// <summary>
/// Verifies soul ownership by calling GET /api/soul/cards/{soulId} and checking for 200.
/// Forwards the caller's Bearer token so Keycloak auth is preserved.
/// 4xx responses (401, 403, 404) → not owned (returns false).
/// 5xx responses → Soul API is unavailable; throws so the caller gets 500, not a silent 404.
/// </summary>
internal sealed class SoulOwnershipChecker(
    IHttpClientFactory httpClientFactory,
    ICurrentUserTokenProvider tokenProvider,
    ILogger<SoulOwnershipChecker> logger) : ISoulOwnershipChecker
{
    internal const string HttpClientName = "soul-ownership";
    private const string SoulCardPath   = "api/soul/cards/";

    public async Task<bool> OwnsSoulAsync(Guid soulId, CancellationToken ct)
    {
        var client = httpClientFactory.CreateClient(HttpClientName);

        var token = tokenProvider.GetBearerToken();
        if (!string.IsNullOrEmpty(token))
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync($"{SoulCardPath}{soulId}", ct);

        if (response.StatusCode == HttpStatusCode.OK)
            return true;

        if ((int)response.StatusCode >= 500)
        {
            logger.LogError(
                "Soul API returned {StatusCode} when checking ownership of soul {SoulId}. Downstream service may be unavailable.",
                (int)response.StatusCode, soulId);
            throw new InvalidOperationException(
                $"Soul API returned {(int)response.StatusCode} when checking ownership of soul '{soulId}'. " +
                "Downstream service may be unavailable.");
        }

        // 401, 403, 404 — not owned or token issue; treat as ownership denied
        return false;
    }
}
