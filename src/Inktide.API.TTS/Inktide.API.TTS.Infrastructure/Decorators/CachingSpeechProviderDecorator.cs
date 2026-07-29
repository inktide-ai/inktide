using System.Diagnostics;
using Inktide.API.Domain.Enums;
using Inktide.API.Domain.Models;
using Inktide.API.TTS.Domain.Models;
using Inktide.API.TTS.Domain.Speech;
using FluentValidation.Results;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Inktide.API.TTS.Infrastructure.Decorators;

/// <summary>
/// Caches <see cref="IModelListingProvider.GetModelsAsync"/> and <see cref="IVoiceListingProvider.GetVoicesAsync"/>
/// results per provider. Synthesis is never cached - it is a stateful streaming operation.
/// Wraps any <see cref="ISpeechProvider"/>; listing methods are no-ops when the inner
/// provider does not declare the corresponding capability.
/// </summary>
public sealed class CachingSpeechProviderDecorator : ISpeechProvider, IVoiceListingProvider, IModelListingProvider
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
        if (!_inner.Capabilities.SupportsModelListing)
            return new SpeechModelCollection("list", []);

        // Invariant: all registered providers that declare SupportsModelListing = true
        // implement IModelListingProvider. Enforced at registration time by SpeechProviderRegistry.
        Debug.Assert(_inner is IModelListingProvider,
            $"{_inner.Id} declares SupportsModelListing but does not implement IModelListingProvider");
        var ml = (IModelListingProvider)_inner;

        if (options.ApiKeyIsTransient)
            return await ml.GetModelsAsync(options, ct).ConfigureAwait(false);

        var key = $"tts:models:{_inner.Id}";

        if (_cache.TryGetValue(key, out SpeechModelCollection? cached) && cached is not null)
        {
            _logger.LogDebug("Cache hit: models for provider {ProviderId}", _inner.Id);
            return cached;
        }

        var models = await ml.GetModelsAsync(options, ct).ConfigureAwait(false);
        _cache.Set(key, models, DefaultTtl);
        return models;
    }

    public async Task<SpeechVoiceCollection> GetVoicesAsync(
        ProviderOptions options,
        string? modelId = null,
        CancellationToken ct = default)
    {
        if (!_inner.Capabilities.SupportsVoiceListing)
            return new SpeechVoiceCollection([]);

        // Invariant: all registered providers that declare SupportsVoiceListing = true
        // implement IVoiceListingProvider. Enforced at registration time by SpeechProviderRegistry.
        Debug.Assert(_inner is IVoiceListingProvider,
            $"{_inner.Id} declares SupportsVoiceListing but does not implement IVoiceListingProvider");
        var vl = (IVoiceListingProvider)_inner;

        if (options.ApiKeyIsTransient)
            return await vl.GetVoicesAsync(options, modelId, ct).ConfigureAwait(false);

        var key = $"tts:voices:{_inner.Id}:{modelId}";

        if (_cache.TryGetValue(key, out SpeechVoiceCollection? cached) && cached is not null)
        {
            _logger.LogDebug("Cache hit: voices for provider {ProviderId} model {ModelId}", _inner.Id, modelId);
            return cached;
        }

        var voices = await vl.GetVoicesAsync(options, modelId, ct).ConfigureAwait(false);
        _cache.Set(key, voices, DefaultTtl);
        return voices;
    }

    public Task<Stream> SynthesizeAsync(
        ProviderOptions providerOptions,
        SpeechOptions speechOptions,
        CancellationToken ct = default)
        => _inner.SynthesizeAsync(providerOptions, speechOptions, ct);

}
