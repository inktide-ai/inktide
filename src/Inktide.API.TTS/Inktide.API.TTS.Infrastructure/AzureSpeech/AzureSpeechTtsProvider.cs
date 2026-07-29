using Inktide.API.Domain.Enums;
using Inktide.API.Domain.Models;
using Inktide.API.TTS.Domain.Models;
using Inktide.API.TTS.Domain.Speech;
using Inktide.API.TTS.Infrastructure;
using FluentValidation.Results;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Inktide.API.TTS.Infrastructure.AzureSpeech;

/// <summary>
/// Microsoft Azure Cognitive Services Speech as <see cref="ISpeechProvider"/>.
/// Requires an API key supplied via <c>X-TTS-Api-Key</c> header or
/// <c>TtsProviders:AzureSpeech:ApiKey</c> config.
/// </summary>
public sealed class AzureSpeechTtsProvider : ISpeechProvider, IVoiceListingProvider
{

    private const float MinSpeed = 0.5f;
    private const float MaxSpeed = 2.0f;

    private readonly AzureSpeechTtsClient _client;
    private readonly IOptions<AzureSpeechTtsClientSettings> _settings;
    private readonly ILogger<AzureSpeechTtsProvider> _logger;


    public AzureSpeechTtsProvider(
        AzureSpeechTtsClient client,
        IOptions<AzureSpeechTtsClientSettings> settings,
        ILogger<AzureSpeechTtsProvider> logger)
    {
        _client   = client   ?? throw new ArgumentNullException(nameof(client));
        _settings = settings ?? throw new ArgumentNullException(nameof(settings));
        _logger   = logger   ?? throw new ArgumentNullException(nameof(logger));
    }


    public string Id => "azure-speech";

    public string Name => "Microsoft Azure Speech";

    public ProviderCategory Category => ProviderCategory.Speech;

    public SpeechProviderCapabilities Capabilities { get; } = new()
    {
        RequiresApiKey       = true,
        SupportsVoiceListing = true,
        SupportsStreaming     = true,
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
                "Azure Speech requires an API key."));
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

        // Azure voice catalog is global - use default region for listing.
        var endpoint = BuildEndpoint(_settings.Value.DefaultRegion);
        return _client.GetVoicesAsync(options.ApiKey, endpoint, ct);
    }

    public async Task<Stream> SynthesizeAsync(
        ProviderOptions providerOptions,
        SpeechOptions speechOptions,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(providerOptions);
        ArgumentNullException.ThrowIfNull(speechOptions);

        var apiKey = providerOptions.ApiKey
            ?? throw new InvalidOperationException("Azure Speech API key is required.");

        // Region/endpoint: prefer runtime ProviderParams["baseUrl"], fall back to settings.
        var baseUrl  = ProviderParamReader.Get(speechOptions.ProviderParams, "baseUrl");
        var endpoint = ResolveEndpoint(baseUrl, _settings.Value.DefaultRegion);

        var speed  = Math.Clamp(speechOptions.Speed <= 0 ? 1.0f : speechOptions.Speed, MinSpeed, MaxSpeed);
        var pitch  = ProviderParamReader.GetNumeric<float>(speechOptions.ProviderParams, "pitch",  0f);
        var volume = ProviderParamReader.GetNumeric<float>(speechOptions.ProviderParams, "volume", 0f);

        var rate = AzureSpeechSsmlBuilder.FormatRate(speed);
        var pitchStr  = AzureSpeechSsmlBuilder.FormatProsodyPercent(pitch);
        var volumeStr = AzureSpeechSsmlBuilder.FormatProsodyPercent(volume);

        var ssml = AzureSpeechSsmlBuilder.Build(
            speechOptions.Voice,
            speechOptions.Text,
            rate,
            pitchStr,
            volumeStr);

        var rawFormat    = MapOutputFormat(speechOptions.AudioFormat);
        if (rawFormat is null)
            _logger.LogWarning(
                "AzureSpeech: unknown audio format '{Format}', falling back to mp3",
                speechOptions.AudioFormat);
        var outputFormat = rawFormat ?? "audio-24khz-48kbitrate-mono-mp3";

        return await _client
            .TextToSpeechStreamAsync(apiKey, endpoint, ssml, outputFormat, ct)
            .ConfigureAwait(false);
    }


    /// <summary>
    /// Resolves a baseUrl/region value to a full Azure Speech endpoint URL.
    /// Accepts a region code ("eastasia") or a full URL ("https://eastasia.tts.speech.microsoft.com").
    /// </summary>
    private static string ResolveEndpoint(string? baseUrl, string defaultRegion)
    {
        if (string.IsNullOrWhiteSpace(baseUrl))
            return BuildEndpoint(defaultRegion);

        if (baseUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
            return baseUrl.TrimEnd('/');

        // Treat as region code.
        return BuildEndpoint(baseUrl.Trim());
    }

    private static string BuildEndpoint(string region)
        => $"https://{region}.tts.speech.microsoft.com";

    private static string? MapOutputFormat(string? audioFormat) =>
        audioFormat?.ToLowerInvariant() switch
        {
            "mp3"  => "audio-24khz-48kbitrate-mono-mp3",
            "wav"  => "riff-24khz-16bit-mono-pcm",
            "ogg"  => "ogg-24khz-16bit-mono-opus",
            "opus" => "ogg-24khz-16bit-mono-opus",
            null   => "audio-24khz-48kbitrate-mono-mp3",
            _      => null,
        };


}
