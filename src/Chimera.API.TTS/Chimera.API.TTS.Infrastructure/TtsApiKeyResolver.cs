using Chimera.API.TTS.Application.Abstractions;
using Chimera.API.TTS.Domain.Exceptions;
using Chimera.API.TTS.Domain.Speech;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Chimera.API.TTS.Infrastructure;

/// <summary>
/// Resolves TTS API keys from the <c>X-TTS-Api-Key</c> header, then from <c>TtsProviders:{id}:ApiKey</c>.
/// </summary>
public sealed class TtsApiKeyResolver : IApiKeyResolver
{
    #region Constants

    public const string TtsApiKeyHeader = "X-TTS-Api-Key";

    #endregion

    #region Fields

    private readonly ISpeechProviderRegistry _speechProviderRegistry;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IConfiguration _configuration;

    #endregion

    #region Constructors

    public TtsApiKeyResolver(
        ISpeechProviderRegistry speechProviderRegistry,
        IHttpContextAccessor httpContextAccessor,
        IConfiguration configuration)
    {
        _speechProviderRegistry = speechProviderRegistry ?? throw new ArgumentNullException(nameof(speechProviderRegistry));
        _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
    }

    #endregion

    #region Public Methods

    /// <inheritdoc />
    public string? Resolve(string providerId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(providerId);

        var provider = _speechProviderRegistry.GetRequired(providerId);
        if (!provider.Capabilities.RequiresApiKey)
        {
            return null;
        }

        var httpContext = _httpContextAccessor.HttpContext;
        var apiKey = httpContext?.Request.Headers[TtsApiKeyHeader].FirstOrDefault();

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            apiKey = _configuration[$"TtsProviders:{provider.Id}:ApiKey"];
        }

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new ApiKeyMissingException(
                $"Speech provider '{provider.Id}' requires an API key (header {TtsApiKeyHeader} or configuration TtsProviders:{provider.Id}:ApiKey).");
        }

        return apiKey;
    }

    #endregion
}
