using Inktide.API.TTS.Application.Abstractions;
using Inktide.API.TTS.Domain.Exceptions;
using Inktide.API.TTS.Domain.Speech;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Inktide.API.TTS.Infrastructure;

/// <summary>
/// Resolves TTS API keys.
/// Sync path (REST): X-TTS-Api-Key header → global config.
/// Async path (pipeline consumer): header → per-user credential (Soul DB) → global config.
/// </summary>
public sealed class TtsApiKeyResolver : IApiKeyResolver
{

    public const string TtsApiKeyHeader = "X-TTS-Api-Key";


    private readonly ISpeechProviderRegistry _speechProviderRegistry;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IConfiguration _configuration;
    private readonly IServiceScopeFactory _scopeFactory;


    public TtsApiKeyResolver(
        ISpeechProviderRegistry speechProviderRegistry,
        IHttpContextAccessor httpContextAccessor,
        IConfiguration configuration,
        IServiceScopeFactory scopeFactory)
    {
        _speechProviderRegistry = speechProviderRegistry ?? throw new ArgumentNullException(nameof(speechProviderRegistry));
        _httpContextAccessor    = httpContextAccessor    ?? throw new ArgumentNullException(nameof(httpContextAccessor));
        _configuration          = configuration          ?? throw new ArgumentNullException(nameof(configuration));
        _scopeFactory           = scopeFactory           ?? throw new ArgumentNullException(nameof(scopeFactory));
    }


    /// <inheritdoc />
    public string? Resolve(string providerId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(providerId);

        if (!_speechProviderRegistry.TryGet(providerId, out var provider))
            throw new ApiKeyMissingException(
                $"Speech provider '{providerId}' is not registered.");

        if (!provider.Capabilities.RequiresApiKey)
            return null;

        var httpContext = _httpContextAccessor.HttpContext;
        var apiKey = httpContext?.Request.Headers[TtsApiKeyHeader].FirstOrDefault();

        if (string.IsNullOrWhiteSpace(apiKey))
            apiKey = _configuration[$"TtsProviders:{provider.Id}:ApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey))
            throw new ApiKeyMissingException(
                $"Speech provider '{provider.Id}' requires an API key (header {TtsApiKeyHeader} or configuration TtsProviders:{provider.Id}:ApiKey).");

        return apiKey;
    }

    /// <inheritdoc />
    public bool IsHeaderKey(string providerId)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        var headerValue = httpContext?.Request.Headers[TtsApiKeyHeader].FirstOrDefault();
        return !string.IsNullOrWhiteSpace(headerValue);
    }

    /// <inheritdoc />
    public async Task<string?> ResolveAsync(Guid? userId, string providerId, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(providerId);

        if (!_speechProviderRegistry.TryGet(providerId, out var provider))
            return null; // provider not registered — caller handles missing provider separately

        if (!provider.Capabilities.RequiresApiKey)
            return null;

        // 1. Per-request header (available when called from HTTP handler)
        var httpContext = _httpContextAccessor.HttpContext;
        var headerKey = httpContext?.Request.Headers[TtsApiKeyHeader].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(headerKey))
            return headerKey;

        // 2. Per-user credential stored in Soul DB (BYOK — ElevenLabs, etc.)
        // Uses a scope because ITtsCredentialPort is Scoped (depends on EF DbContext).
        if (userId is { } uid && uid != Guid.Empty)
        {
            using var scope = _scopeFactory.CreateScope();
            var credPort = scope.ServiceProvider.GetRequiredService<ITtsCredentialPort>();
            var cred = await credPort.GetDecryptedAsync(uid, providerId, ct);
            if (cred is not null && !string.IsNullOrWhiteSpace(cred.ApiKey))
                return cred.ApiKey;
        }

        // 3. Global server-side config (shared key for all users)
        var configKey = _configuration[$"TtsProviders:{providerId}:ApiKey"];
        if (!string.IsNullOrWhiteSpace(configKey))
            return configKey;

        return null;
    }

    /// <inheritdoc />
    public async Task<string?> ResolveBaseUrlAsync(Guid? userId, string providerId, CancellationToken ct = default)
    {
        if (userId is not { } uid || uid == Guid.Empty)
            return null;

        using var scope = _scopeFactory.CreateScope();
        var credPort = scope.ServiceProvider.GetRequiredService<ITtsCredentialPort>();
        var cred = await credPort.GetDecryptedAsync(uid, providerId, ct);
        return string.IsNullOrWhiteSpace(cred?.BaseUrl) ? null : cred.BaseUrl;
    }

}
