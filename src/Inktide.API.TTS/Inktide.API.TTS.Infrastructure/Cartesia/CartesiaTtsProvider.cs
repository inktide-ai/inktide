using Inktide.API.Domain.Enums;
using Inktide.API.Domain.Models;
using Inktide.API.TTS.Domain.Models;
using Inktide.API.TTS.Domain.Speech;
using FluentValidation.Results;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Inktide.API.TTS.Infrastructure.Cartesia;

/// <summary>
/// Cartesia cloud TTS as <see cref="ISpeechProvider"/>.
/// Requires an API key supplied via <c>X-TTS-Api-Key</c> header or
/// <c>TtsProviders:Cartesia:ApiKey</c> config.
/// </summary>
public sealed class CartesiaTtsProvider : ISpeechProvider, IVoiceListingProvider, IModelListingProvider
{

    /// <summary>Cartesia speed range: -1.0 (slowest) to 1.0 (fastest), 0.0 = normal.</summary>
    private const double CartesiaMinSpeed = -1.0;
    private const double CartesiaMaxSpeed =  1.0;

    /// <summary>Incoming speed is a familiar multiplier (0.0–2.0); 1.0 = normal.</summary>
    private const float IncomingMinSpeed = 0.0f;
    private const float IncomingMaxSpeed = 2.0f;

    private static readonly SpeechModelCollection KnownModels = new("list",
    [
        new("sonic-2",     "model", DateTimeOffset.UnixEpoch, "cartesia"),
        new("sonic-turbo", "model", DateTimeOffset.UnixEpoch, "cartesia"),
    ]);


    private readonly CartesiaTtsClient _client;
    private readonly IOptions<CartesiaTtsClientSettings> _settings;
    private readonly ILogger<CartesiaTtsProvider> _logger;


    public CartesiaTtsProvider(
        CartesiaTtsClient client,
        IOptions<CartesiaTtsClientSettings> settings,
        ILogger<CartesiaTtsProvider> logger)
    {
        _client   = client   ?? throw new ArgumentNullException(nameof(client));
        _settings = settings ?? throw new ArgumentNullException(nameof(settings));
        _logger   = logger   ?? throw new ArgumentNullException(nameof(logger));
    }


    public string Id => "cartesia";

    public string Name => "Cartesia";

    public ProviderCategory Category => ProviderCategory.Speech;

    public SpeechProviderCapabilities Capabilities { get; } = new()
    {
        RequiresApiKey       = true,
        SupportsVoiceListing = true,
        SupportsStreaming     = true,
        SupportsModelListing  = true,
    };


    public ValidationResult Validate(ProviderOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(options.ApiKey))
        {
            result.Errors.Add(new ValidationFailure(
                nameof(options.ApiKey),
                "Cartesia requires an API key."));
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
            ?? throw new InvalidOperationException("Cartesia API key is required.");

        var modelId = !string.IsNullOrWhiteSpace(speechOptions.Model)
            ? speechOptions.Model
            : _settings.Value.DefaultModel;

        var p = CartesiaParams.From(speechOptions.ProviderParams);

        // Map familiar speed multiplier (0–2, 1=normal) → Cartesia range (-1 to 1, 0=normal).
        var incomingSpeed  = Math.Clamp(speechOptions.Speed <= 0 ? 1.0f : speechOptions.Speed, IncomingMinSpeed, IncomingMaxSpeed);
        var cartesiaSpeed  = Math.Clamp(incomingSpeed - 1.0, CartesiaMinSpeed, CartesiaMaxSpeed);

        var rawFormat = MapOutputFormat(speechOptions.AudioFormat);
        if (rawFormat is null)
            _logger.LogWarning(
                "Cartesia: unknown audio format '{Format}', falling back to mp3",
                speechOptions.AudioFormat);
        var (container, encoding, sampleRate) = rawFormat ?? ("mp3", "mp3", 44100);

        var options = new CartesiaSpeechOptions
        {
            ModelId    = modelId,
            Transcript = speechOptions.Text,
            Voice = new CartesiaVoice
            {
                Mode = "id",
                Id   = speechOptions.Voice,
                ExperimentalControls = new CartesiaVoiceControls
                {
                    Speed = cartesiaSpeed,
                },
            },
            OutputFormat = new CartesiaOutputFormat
            {
                Container  = container,
                Encoding   = encoding,
                SampleRate = sampleRate,
            },
        };

        return await _client
            .TextToSpeechStreamAsync(apiKey, options, ct)
            .ConfigureAwait(false);
    }


    private static (string container, string encoding, int sampleRate)? MapOutputFormat(string? audioFormat) =>
        audioFormat?.ToLowerInvariant() switch
        {
            "mp3"  => ("mp3", "mp3",      44100),
            "wav"  => ("wav", "pcm_f32le", 44100),
            "ogg"  => ("ogg", "opus",      48000),
            "opus" => ("ogg", "opus",      48000),
            null   => ("mp3", "mp3",       44100),
            _      => null,
        };

}
