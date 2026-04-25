using Inktide.API.Domain.Enums;
using Inktide.API.Domain.Models;
using Inktide.API.TTS.Domain.Models;
using Inktide.API.TTS.Domain.Speech;
using FluentValidation.Results;
using Google.Cloud.TextToSpeech.V1;
using Microsoft.Extensions.Logging;

namespace Inktide.API.TTS.Infrastructure.GoogleCloud;

/// <summary>
/// Google Cloud Text-to-Speech as <see cref="ISpeechProvider"/>.
/// Uses the official SDK over gRPC with API key authentication.
/// Requires an API key via <c>X-TTS-Api-Key</c> header or
/// <c>TtsProviders:GoogleCloudTts:ApiKey</c> config.
/// </summary>
public sealed class GoogleCloudTtsProvider : ISpeechProvider
{

    private const double MinSpeed  = 0.25;
    private const double MaxSpeed  = 4.0;
    private const double MinPitch  = -20.0;
    private const double MaxPitch  = 20.0;
    private const double MinVolume = -10.0;
    private const double MaxVolume = 10.0;

    private static readonly SpeechModelCollection EmptyModels = new("list", []);


    private readonly GoogleCloudTtsClient _client;
    private readonly ILogger<GoogleCloudTtsProvider> _logger;


    public GoogleCloudTtsProvider(
        GoogleCloudTtsClient client,
        ILogger<GoogleCloudTtsProvider> logger)
    {
        _client = client  ?? throw new ArgumentNullException(nameof(client));
        _logger = logger  ?? throw new ArgumentNullException(nameof(logger));
    }


    public string Id => "google-cloud-tts";

    public string Name => "Google Cloud TTS";

    public ProviderCategory Category => ProviderCategory.Speech;

    public SpeechProviderCapabilities Capabilities { get; } = new()
    {
        RequiresApiKey       = true,
        SupportsVoiceListing = true,
        SupportsStreaming     = false,
        SupportsModelListing  = false,
    };


    public ValidationResult Validate(ProviderOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(options.ApiKey))
        {
            result.Errors.Add(new ValidationFailure(
                nameof(options.ApiKey),
                "Google Cloud TTS requires an API key."));
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
            return Task.FromResult(new SpeechVoiceCollection([]));

        return _client.GetVoicesAsync(options.ApiKey, ct);
    }

    public Task<SpeechModelCollection> GetModelsAsync(
        ProviderOptions options,
        CancellationToken ct = default)
    {
        return Task.FromResult(EmptyModels);
    }

    public async Task<Stream> SynthesizeAsync(
        ProviderOptions providerOptions,
        SpeechOptions speechOptions,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(providerOptions);
        ArgumentNullException.ThrowIfNull(speechOptions);

        var apiKey = providerOptions.ApiKey
            ?? throw new InvalidOperationException("Google Cloud TTS API key is required.");

        var speed  = Math.Clamp(speechOptions.Speed <= 0 ? 1.0 : speechOptions.Speed, MinSpeed, MaxSpeed);
        var pitch  = Math.Clamp(GetProviderParamDouble(speechOptions.ProviderParams, "pitch",  0.0), MinPitch,  MaxPitch);
        var volume = Math.Clamp(GetProviderParamDouble(speechOptions.ProviderParams, "volume", 0.0), MinVolume, MaxVolume);
        var locale = DeriveLocale(speechOptions.Voice);

        var request = new SynthesizeSpeechRequest
        {
            Input = new SynthesisInput { Text = speechOptions.Text },
            Voice = new VoiceSelectionParams
            {
                LanguageCode = locale,
                Name         = speechOptions.Voice,
            },
            AudioConfig = new AudioConfig
            {
                AudioEncoding = MapAudioEncoding(speechOptions.AudioFormat),
                SpeakingRate  = speed,
                Pitch         = pitch,
                VolumeGainDb  = volume,
            },
        };

        return await _client.SynthesizeAsync(apiKey, request, ct).ConfigureAwait(false);
    }


    private AudioEncoding MapAudioEncoding(string? audioFormat)
    {
        var encoding = audioFormat?.ToLowerInvariant() switch
        {
            "mp3"  => AudioEncoding.Mp3,
            "wav"  => AudioEncoding.Linear16,
            "ogg"  => AudioEncoding.OggOpus,
            "opus" => AudioEncoding.OggOpus,
            null   => AudioEncoding.Mp3,
            _      => (AudioEncoding?)null,
        };

        if (encoding is null)
        {
            _logger.LogWarning(
                "GoogleCloudTTS: unknown audio format '{Format}', falling back to mp3",
                audioFormat);
            encoding = AudioEncoding.Mp3;
        }

        return encoding.Value;
    }

    /// <summary>
    /// Derives a BCP-47 language code from a Google voice name.
    /// e.g. "en-US-Standard-A" → "en-US", "cmn-CN-Wavenet-A" → "cmn-CN".
    /// </summary>
    private static string DeriveLocale(string voiceName)
    {
        if (string.IsNullOrWhiteSpace(voiceName)) return "en-US";

        var parts = voiceName.Split('-');
        return parts.Length >= 2 ? $"{parts[0]}-{parts[1]}" : "en-US";
    }

    private static string? GetProviderParam(
        IReadOnlyDictionary<string, object>? providerParams,
        string key)
    {
        if (providerParams is null) return null;
        if (!providerParams.TryGetValue(key, out var val)) return null;
        return val?.ToString();
    }

    private static double GetProviderParamDouble(
        IReadOnlyDictionary<string, object>? providerParams,
        string key,
        double defaultValue)
    {
        var str = GetProviderParam(providerParams, key);
        if (string.IsNullOrWhiteSpace(str)) return defaultValue;

        return double.TryParse(str, System.Globalization.NumberStyles.Float,
            System.Globalization.CultureInfo.InvariantCulture, out var d)
            ? d
            : defaultValue;
    }

}
