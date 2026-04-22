using Chimera.API.Domain.Enums;
using Chimera.API.Domain.Models;
using Chimera.API.TTS.Domain.Models;
using Chimera.API.TTS.Domain.Speech;
using FluentValidation.Results;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Chimera.API.TTS.Infrastructure.Decorators;

/// <summary>
/// Caches <see cref="GetModelsAsync"/> and <see cref="GetVoicesAsync"/> results per provider.
/// Synthesis is never cached — it is a stateful streaming operation.
/// </summary>
public sealed class CachingSpeechProviderDecorator : ISpeechProvider
{

    private static readonly TimeSpan DefaultTtl = TimeSpan.FromMinutes(15);


    private readonly ISpeechProvider _inner;
    private readonly IMemoryCache _cache;
    private readonly ILogger<CachingSpeechProviderDecorator> _logger;


    public CachingSpeechProviderDecorator(
        ISpeechProvider inner,
        IMemoryCache cache,
        ILogger<CachingSpeechProviderDecorator> logger)
    {
        _inner = inner ?? throw new ArgumentNullException(nameof(inner));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }


    public string Id => _inner.Id;

    public string Name => _inner.Name;

    public ProviderCategory Category => _inner.Category;

    public SpeechProviderCapabilities Capabilities => _inner.Capabilities;


    public ValidationResult Validate(ProviderOptions options) => _inner.Validate(options);

    public async Task<SpeechModelCollection> GetModelsAsync(
        ProviderOptions options,
        CancellationToken ct = default)
    {
        var key = $"tts:models:{_inner.Id}";

        if (_cache.TryGetValue(key, out SpeechModelCollection? cached) && cached is not null)
        {
            _logger.LogDebug("Cache hit: models for provider {ProviderId}", _inner.Id);
            return cached;
        }

        var models = await _inner.GetModelsAsync(options, ct).ConfigureAwait(false);
        _cache.Set(key, models, DefaultTtl);
        return models;
    }

    public async Task<SpeechVoiceCollection> GetVoicesAsync(
        ProviderOptions options,
        string? modelId = null,
        CancellationToken ct = default)
    {
        var key = $"tts:voices:{_inner.Id}:{modelId}";

        if (_cache.TryGetValue(key, out SpeechVoiceCollection? cached) && cached is not null)
        {
            _logger.LogDebug("Cache hit: voices for provider {ProviderId} model {ModelId}", _inner.Id, modelId);
            return cached;
        }

        var voices = await _inner.GetVoicesAsync(options, modelId, ct).ConfigureAwait(false);
        _cache.Set(key, voices, DefaultTtl);
        return voices;
    }

    public Task<Stream> SynthesizeAsync(
        ProviderOptions providerOptions,
        SpeechOptions speechOptions,
        CancellationToken ct = default)
        => _inner.SynthesizeAsync(providerOptions, speechOptions, ct);

}
