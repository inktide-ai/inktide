using Inktide.API.Domain.Enums;
using Inktide.API.Domain.Models;
using Inktide.API.TTS.Domain.Models;
using Inktide.API.TTS.Domain.Speech;
using FluentValidation.Results;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Inktide.API.TTS.Infrastructure.FishAudio;

/// <summary>
/// Fish Audio cloud TTS as <see cref="ISpeechProvider"/>.
/// Requires an API key supplied via <c>X-TTS-Api-Key</c> header or
/// <c>TtsProviders:FishAudio:ApiKey</c> config.
/// </summary>
public sealed class FishAudioTtsProvider : ISpeechProvider, IVoiceListingProvider, IModelListingProvider
{

    private const double MinSpeed = 0.5;
    private const double MaxSpeed = 2.0;

    private static readonly SpeechModelCollection KnownModels = new("list",
    [
        new("s1",     "model", DateTimeOffset.UnixEpoch, "fishaudio"),
        new("s2-pro", "model", DateTimeOffset.UnixEpoch, "fishaudio"),
    ]);


    private readonly FishAudioTtsClient _client;
    private readonly IOptions<FishAudioTtsClientSettings> _settings;
    private readonly ILogger<FishAudioTtsProvider> _logger;


    public FishAudioTtsProvider(
        FishAudioTtsClient client,
        IOptions<FishAudioTtsClientSettings> settings,
        ILogger<FishAudioTtsProvider> logger)
    {
        _client   = client   ?? throw new ArgumentNullException(nameof(client));
        _settings = settings ?? throw new ArgumentNullException(nameof(settings));
        _logger   = logger   ?? throw new ArgumentNullException(nameof(logger));
    }


    public string Id => "fishaudio";

    public string Name => "Fish Audio";

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
                "Fish Audio requires an API key."));
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
        return Task.FromResult(KnownModels);
    }

    public async Task<Stream> SynthesizeAsync(
        ProviderOptions providerOptions,
        SpeechOptions speechOptions,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(providerOptions);
        ArgumentNullException.ThrowIfNull(speechOptions);

        var apiKey = providerOptions.ApiKey
            ?? throw new InvalidOperationException("Fish Audio API key is required.");

        var model = !string.IsNullOrWhiteSpace(speechOptions.Model)
            ? speechOptions.Model
            : _settings.Value.DefaultModel;

        var rawFormat = MapOutputFormat(speechOptions.AudioFormat);
        if (rawFormat is null)
            _logger.LogWarning(
                "FishAudio: unknown audio format '{Format}', falling back to mp3",
                speechOptions.AudioFormat);
        var fishOptions = MapSpeechOptions(speechOptions, rawFormat ?? "mp3");

        return await _client
            .TextToSpeechStreamAsync(speechOptions.Voice, apiKey, model, fishOptions, ct)
            .ConfigureAwait(false);
    }


    private static FishAudioSpeechOptions MapSpeechOptions(SpeechOptions options, string format)
    {
        var p = FishAudioParams.From(options.ProviderParams);

        return new FishAudioSpeechOptions
        {
            Text      = options.Text,
            Format    = format,
            Speed     = (float)Math.Clamp(options.Speed <= 0 ? 1.0 : options.Speed, MinSpeed, MaxSpeed),
            Latency   = p.GetLatency(),
            Normalize = p.GetNormalize(),
            Streaming = true,
        };
    }

    private static string? MapOutputFormat(string? audioFormat) =>
        audioFormat?.ToLowerInvariant() switch
        {
            "mp3"  => "mp3",
            "opus" => "opus",
            "wav"  => "wav",
            "pcm"  => "pcm",
            null   => "mp3",
            _      => null,
        };

}
