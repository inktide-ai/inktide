using Chimera.API.Domain.Enums;
using Chimera.API.Domain.Models;
using Chimera.API.TTS.Domain.Models;
using Chimera.API.TTS.Domain.Speech;
using FluentValidation.Results;
using Microsoft.Extensions.Logging;

namespace Chimera.API.TTS.Infrastructure.ElevenLabs;

/// <summary>
/// ElevenLabs cloud TTS as <see cref="ISpeechProvider"/>.
/// Requires an API key supplied via <c>X-TTS-Api-Key</c> header or
/// <c>TtsProviders:ElevenLabs:ApiKey</c> config.
/// </summary>
public sealed class ElevenLabsTtsProvider : ISpeechProvider
{
    #region Constants

    private const string DefaultModelId    = "eleven_multilingual_v2";
    private const double MinSpeed          = 0.7;
    private const double MaxSpeed          = 1.2;

    #endregion

    #region Fields

    private readonly ElevenLabsTtsClient _client;
    private readonly ILogger<ElevenLabsTtsProvider> _logger;

    #endregion

    #region Constructor

    public ElevenLabsTtsProvider(
        ElevenLabsTtsClient client,
        ILogger<ElevenLabsTtsProvider> logger)
    {
        _client = client ?? throw new ArgumentNullException(nameof(client));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #endregion

    #region Properties

    public string Id => "elevenlabs";

    public string Name => "ElevenLabs";

    public ProviderCategory Category => ProviderCategory.Speech;

    public SpeechProviderCapabilities Capabilities { get; } = new()
    {
        RequiresApiKey      = true,
        SupportsVoiceListing = true,
        SupportsStreaming    = true,
        SupportsModelListing = true,
    };

    #endregion

    #region Public Methods

    public ValidationResult Validate(ProviderOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(options.ApiKey))
        {
            result.Errors.Add(new ValidationFailure(
                nameof(options.ApiKey),
                "ElevenLabs requires an API key."));
        }

        return result;
    }

    public Task<SpeechVoiceCollection> GetVoicesAsync(
        ProviderOptions options,
        string? modelId = null,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (string.IsNullOrWhiteSpace(options.ApiKey))
        {
            return Task.FromResult(new SpeechVoiceCollection([]));
        }

        return _client.GetVoicesAsync(options.ApiKey, ct);
    }

    public Task<SpeechModelCollection> GetModelsAsync(
        ProviderOptions options,
        CancellationToken ct = default)
    {
        return _client.GetModelsAsync(ct);
    }

    public async Task<Stream> SynthesizeAsync(
        ProviderOptions providerOptions,
        SpeechOptions speechOptions,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(providerOptions);
        ArgumentNullException.ThrowIfNull(speechOptions);

        var apiKey = providerOptions.ApiKey
            ?? throw new InvalidOperationException("ElevenLabs API key is required.");

        var modelId = !string.IsNullOrWhiteSpace(speechOptions.Model)
            ? speechOptions.Model
            : DefaultModelId;

        var outputFormat  = MapOutputFormat(speechOptions.AudioFormat);
        var voiceSettings = MapVoiceSettings(speechOptions);

        var options = new ElevenLabsSpeechOptions
        {
            Text          = speechOptions.Text,
            ModelId       = modelId,
            VoiceSettings = voiceSettings,
        };

        return await _client
            .TextToSpeechStreamAsync(speechOptions.Voice, apiKey, outputFormat, options, ct)
            .ConfigureAwait(false);
    }

    #endregion

    #region Private Methods

    private string MapOutputFormat(string? audioFormat)
    {
        var mapped = audioFormat?.ToLowerInvariant() switch
        {
            "mp3"  => "mp3_44100_128",
            "pcm"  => "pcm_44100",
            "opus" => "opus_48000_128",
            null   => "mp3_44100_128",
            _      => null,
        };

        if (mapped is null)
        {
            _logger.LogWarning(
                "ElevenLabs: unknown audio format '{Format}', falling back to mp3_44100_128",
                audioFormat);
            mapped = "mp3_44100_128";
        }

        return mapped;
    }

    private static ElevenLabsVoiceSettings MapVoiceSettings(SpeechOptions options)
    {
        var p = ElevenLabsParams.From(options.ProviderParams);

        return new ElevenLabsVoiceSettings
        {
            Stability       = p.GetStability(),
            SimilarityBoost = p.GetSimilarityBoost(),
            Style           = p.GetStyle(),
            UseSpeakerBoost = p.GetUseSpeakerBoost(),
            Speed           = Math.Clamp(options.Speed <= 0 ? 1.0 : options.Speed, MinSpeed, MaxSpeed),
        };
    }

    #endregion
}
