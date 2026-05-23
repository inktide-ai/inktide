using System.Net;
using System.Net.Http.Headers;
using Inktide.API.Marketplace.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace Inktide.API.Marketplace.Infrastructure.Services;

/// <summary>
/// Verifies soul ownership by calling GET /api/soul/cards/{soulId} and checking for 200.
/// Forwards the caller's Bearer token so Keycloak auth is preserved.
/// </summary>
internal sealed class SoulOwnershipChecker(
    IHttpClientFactory httpClientFactory,
    IHttpContextAccessor httpContextAccessor) : ISoulOwnershipChecker
{
    public async Task<bool> OwnsSoulAsync(Guid userId, Guid soulId, CancellationToken ct)
    {
        var client = httpClientFactory.CreateClient("soul-ownership");

        var token = httpContextAccessor.HttpContext?
            .Request.Headers.Authorization.ToString()
            .Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase);

        if (!string.IsNullOrEmpty(token))
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync($"api/soul/cards/{soulId}", ct);
        return response.StatusCode == HttpStatusCode.OK;
    }
}
