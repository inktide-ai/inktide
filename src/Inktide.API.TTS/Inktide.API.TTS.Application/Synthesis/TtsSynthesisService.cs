using System.Net.Http;
using Inktide.API.Domain.Models;
using Inktide.API.TTS.Application.Abstractions;
using Inktide.API.TTS.Application.Configuration;
using Inktide.API.TTS.Domain.Exceptions;
using Inktide.API.TTS.Domain.Models;
using Inktide.API.TTS.Domain.Speech;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Inktide.API.TTS.Application.Synthesis;

/// <summary>
/// TTS synthesis orchestration (no HTTP).
/// </summary>
public sealed class TtsSynthesisService : ITtsSynthesisService
{

    private readonly ISpeechProviderRegistry _speechProviderRegistry;
    private readonly IOptions<TtsProviderOptions> _ttsOptions;
    private readonly IApiKeyResolver _apiKeyResolver;
    private readonly ITtsUsageRecorder _usageRecorder;
    private readonly ILogger<TtsSynthesisService> _logger;


    public TtsSynthesisService(
        ISpeechProviderRegistry speechProviderRegistry,
        IOptions<TtsProviderOptions> ttsOptions,
        IApiKeyResolver apiKeyResolver,
        ITtsUsageRecorder usageRecorder,
        ILogger<TtsSynthesisService> logger)
    {
        _speechProviderRegistry = speechProviderRegistry ?? throw new ArgumentNullException(nameof(speechProviderRegistry));
        _ttsOptions = ttsOptions ?? throw new ArgumentNullException(nameof(ttsOptions));
        _apiKeyResolver = apiKeyResolver ?? throw new ArgumentNullException(nameof(apiKeyResolver));
        _usageRecorder = usageRecorder ?? throw new ArgumentNullException(nameof(usageRecorder));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }


    /// <inheritdoc />
    public async Task<GetVoicesResult> GetVoicesAsync(string? providerId, CancellationToken ct = default)
    {
        if (!TryResolveProvider(providerId, out var provider, out var notFoundId))
            return new GetVoicesResult.ProviderNotFound(notFoundId!);

        if (provider is not IVoiceListingProvider voiceListing || !provider.Capabilities.SupportsVoiceListing)
            return new GetVoicesResult.NotSupported(provider.Id);

        var providerOptions = new ProviderOptions { ProviderId = provider.Id };

        // Resolve API key so providers that require auth for voice listing (e.g. ElevenLabs) work.
        try
        {
            var apiKey = _apiKeyResolver.Resolve(provider.Id);
            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                providerOptions.ApiKey = apiKey;
                providerOptions.ApiKeyIsTransient = _apiKeyResolver.IsHeaderKey(provider.Id);
            }
        }
        catch (ApiKeyMissingException)
        {
            return new GetVoicesResult.ApiKeyRequired(provider.Id);
        }

        var voices = await voiceListing
            .GetVoicesAsync(providerOptions, ct: ct)
            .ConfigureAwait(false);

        return new GetVoicesResult.Ok(voices);
    }

    /// <inheritdoc />
    public IReadOnlyCollection<SpeechProviderDescriptor> GetProviderCatalog()
    {
        return _speechProviderRegistry.Descriptors.Values
            .OrderBy(d => d.Id, StringComparer.Ordinal)
            .ToList();
    }

    /// <inheritdoc />
    public async Task<SpeechResult> SynthesizeAsync(SynthesizeCommand command, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);

        if (!TryResolveProvider(command.ProviderId, out var provider, out var notFoundId))
        {
            return new SpeechResult.ProviderNotFound(notFoundId!);
        }

        var providerOptions = new ProviderOptions
        {
            ProviderId = provider.Id,
        };

        Guid? parsedUserId = Guid.TryParse(command.UserId, out var g) ? g : null;

        // Use async resolver: header → per-user credential (Soul DB) → global config → null
        var apiKey = await _apiKeyResolver.ResolveAsync(parsedUserId, provider.Id, cancellationToken);

        if (provider.Capabilities.RequiresApiKey && string.IsNullOrWhiteSpace(apiKey))
            return new SpeechResult.ApiKeyMissing(provider.Id);

        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            providerOptions.ApiKey = apiKey;
            providerOptions.ApiKeyIsTransient = _apiKeyResolver.IsHeaderKey(provider.Id);
        }

        // Base URL: per-soul override (command) wins over per-user BYOK credential base URL.
        var credBaseUrl = await _apiKeyResolver.ResolveBaseUrlAsync(parsedUserId, provider.Id, cancellationToken);
        var resolvedBaseUrl = string.IsNullOrWhiteSpace(command.BaseUrl) ? credBaseUrl : command.BaseUrl;
        if (!string.IsNullOrWhiteSpace(resolvedBaseUrl))
            providerOptions.BaseUrl = resolvedBaseUrl;

        var validation = provider.Validate(providerOptions);
        if (!validation.IsValid)
        {
            var errors = validation.Errors
                .Select(e => new SpeechValidationError(e.PropertyName, e.ErrorMessage))
                .ToList();

            return new SpeechResult.ValidationFailed(errors);
        }

        if (command.Stream && !provider.Capabilities.SupportsStreaming)
        {
            return new SpeechResult.StreamingNotSupported(provider.Id);
        }

        var audioFormat = string.IsNullOrWhiteSpace(command.AudioFormat)
            ? null
            : command.AudioFormat.Trim().ToLowerInvariant();

        var speechRequest = new SpeechOptions(
            Text:           command.Text.Trim(),
            Voice:          command.VoiceId.Trim(),
            Model:          string.IsNullOrWhiteSpace(command.ModelId) ? null : command.ModelId.Trim(),
            Speed:          command.Speed ?? 1f,
            AudioFormat:    audioFormat,
            ProviderParams: command.ProviderParams);

        try
        {
            var stream = await provider
                .SynthesizeAsync(providerOptions, speechRequest, cancellationToken)
                .ConfigureAwait(false);

            var contentType = ResolveContentType(audioFormat);

            await _usageRecorder.RecordAsync(new TtsUsageEvent(
                UserId: command.UserId,
                ProviderId: provider.Id,
                CharacterCount: speechRequest.Text.Length,
                AudioFormat: audioFormat ?? "mp3",
                Streamed: command.Stream,
                TimestampUtc: DateTimeOffset.UtcNow))
                .ConfigureAwait(false);

            return new SpeechResult.Ok(stream, contentType);
        }
        catch (HttpRequestException ex)
        {
            // Log full details server-side; never forward raw upstream messages to the client.
            _logger.LogWarning(ex, "TTS upstream HTTP failure for provider {ProviderId}: {Message}", provider.Id, ex.Message);
            return new SpeechResult.UpstreamError("TTS provider is temporarily unavailable.");
        }
        catch (SpeechProviderException ex)
        {
            _logger.LogWarning(ex, "TTS provider error for {ProviderId}: {Message}", provider.Id, ex.Message);
            return new SpeechResult.UpstreamError(ex.Message);
        }
    }


    private bool TryResolveProvider(string? requestedProviderId, out ISpeechProvider provider, out string? notFoundId)
    {
        notFoundId = null;

        if (!string.IsNullOrWhiteSpace(requestedProviderId))
        {
            var id = requestedProviderId.Trim();
            if (!_speechProviderRegistry.TryGet(id, out var resolved) || resolved is null)
            {
                provider = null!;
                notFoundId = id;
                return false;
            }

            provider = resolved;
            return true;
        }

        var defaultId = _ttsOptions.Value.DefaultProviderId;
        if (!_speechProviderRegistry.TryGet(defaultId, out var defaultProvider))
        {
            provider = null!;
            notFoundId = defaultId;
            return false;
        }

        provider = defaultProvider;
        return true;
    }

    private static string ResolveContentType(string? audioFormat) => audioFormat switch
    {
        "mp3"  => "audio/mpeg",
        "wav"  => "audio/wav",
        "opus" => "audio/opus",
        "flac" => "audio/flac",
        "ogg"  => "audio/ogg",
        "webm" => "audio/webm",
        "pcm"  => "audio/pcm",
        "aac"  => "audio/aac",
        _      => "audio/mpeg",
    };

}
