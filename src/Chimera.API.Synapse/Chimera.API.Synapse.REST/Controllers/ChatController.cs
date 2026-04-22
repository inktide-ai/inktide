using Chimera.API.Core;
using Chimera.API.Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Chimera.API.Synapse.REST.Controllers;

[ApiController]
[Route("api/v1/chat")]
[Produces("application/json")]
public sealed class ChatController : ControllerBase
{

    private readonly IChatProviderRegistry _registry;


    public ChatController(IChatProviderRegistry registry)
    {
        _registry = registry ?? throw new ArgumentNullException(nameof(registry));
    }


    /// <summary>
    /// Catalog of registered chat providers (id, display name, capabilities). No auth required.
    /// </summary>
    [HttpGet("providers")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IReadOnlyCollection<ChatProviderDescriptor>), StatusCodes.Status200OK)]
    public IActionResult GetProviders()
    {
        var descriptors = _registry.Descriptors.Values
            .OrderBy(d => d.Id, StringComparer.Ordinal)
            .ToList();

        return Ok(descriptors);
    }

    /// <summary>
    /// Lists available models for a provider. Fetches live from the provider API.
    /// Pass <c>base_url</c> for self-hosted providers like Ollama.
    /// No auth required — credentials are passed via query params, not stored here.
    /// </summary>
    [HttpGet("models")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IReadOnlyList<ModelInfo>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> GetModelsAsync(
        [FromQuery(Name = "provider_id")] string? providerId,
        [FromQuery(Name = "base_url")] string? baseUrl,
        [FromQuery(Name = "api_key")] string? apiKey,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(providerId))
            return Problem(detail: "provider_id is required.", statusCode: StatusCodes.Status400BadRequest);

        if (!_registry.TryGet(providerId, out var provider))
            return Problem(detail: $"Chat provider '{providerId}' is not registered.", statusCode: StatusCodes.Status400BadRequest);

        var options = new ProviderOptions
        {
            ProviderId = providerId,
            BaseUrl = string.IsNullOrWhiteSpace(baseUrl) ? null : baseUrl,
            ApiKey = string.IsNullOrWhiteSpace(apiKey) ? null : apiKey,
        };

        try
        {
            var models = await provider.ListModelsAsync(options, cancellationToken).ConfigureAwait(false);
            return Ok(models);
        }
        catch (HttpRequestException)
        {
            return Problem(
                detail: $"Could not reach provider '{providerId}'. Check that the service is running and the base_url is correct.",
                statusCode: StatusCodes.Status502BadGateway);
        }
    }

}
