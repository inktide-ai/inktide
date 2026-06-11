using System.Net;
using System.Net.Http.Headers;
using Inktide.API.Marketplace.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Marketplace.Infrastructure.Services;

internal sealed class ProjectOwnershipChecker(
    IHttpClientFactory httpClientFactory,
    ICurrentUserTokenProvider tokenProvider,
    ILogger<ProjectOwnershipChecker> logger) : IProjectOwnershipChecker
{
    internal const string HttpClientName = "project-ownership";
    private const string ProjectPath     = "api/projects/";

    public async Task<bool> OwnsProjectAsync(Guid projectId, CancellationToken ct)
    {
        var client = httpClientFactory.CreateClient(HttpClientName);

        var token = tokenProvider.GetBearerToken();
        if (!string.IsNullOrEmpty(token))
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var response = await client.GetAsync($"{ProjectPath}{projectId}", ct);

        if (response.StatusCode == HttpStatusCode.OK)
            return true;

        if ((int)response.StatusCode >= 500)
        {
            logger.LogError(
                "Project API returned {StatusCode} when checking ownership of project {ProjectId}. Downstream service may be unavailable.",
                (int)response.StatusCode, projectId);
            throw new InvalidOperationException(
                $"Project API returned {(int)response.StatusCode} when checking ownership of project '{projectId}'. " +
                "Downstream service may be unavailable.");
        }

        return false;
    }
}
