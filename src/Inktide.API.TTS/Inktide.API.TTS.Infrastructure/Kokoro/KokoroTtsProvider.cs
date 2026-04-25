using Inktide.API.Domain.Enums;
using Inktide.API.Domain.Models;
using Inktide.API.TTS.Domain.Speech;
using Inktide.API.TTS.Domain.Models;
using FluentValidation;
using FluentValidation.Results;

namespace Inktide.API.TTS.Infrastructure.Kokoro;

/// <summary>
/// Kokoro TTS (OpenAI-compatible HTTP API) as <see cref="ISpeechProvider"/>.
/// </summary>
public sealed class KokoroTtsProvider : ISpeechProvider
{
    

    private readonly KokoroTtsClient _client;


    public KokoroTtsProvider(KokoroTtsClient client)
    {
        _client = client ?? throw new ArgumentNullException(nameof(client));
    }


    public string Id => "kokoro";

    public string Name => "Kokoro";

    public ProviderCategory Category => ProviderCategory.Speech;

    public SpeechProviderCapabilities Capabilities { get; } = new()
    {
        RequiresApiKey = false,
        SupportsVoiceListing = true,
        SupportsStreaming = true,
    };


    public ValidationResult Validate(ProviderOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        return new ValidationResult();
    }

    public Task<SpeechVoiceCollection> GetVoicesAsync(
        ProviderOptions options,
        string? modelId = null,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(options);

        return _client.GetVoicesAsync(ct);
    }

    public Task<SpeechModelCollection> GetModelsAsync(
        ProviderOptions options,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(options);
        
        return _client.GetModelsAsync(ct);
    }

    public async Task<Stream> SynthesizeAsync(
        ProviderOptions providerOptions,
        SpeechOptions speechOptions,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(providerOptions);
        ArgumentNullException.ThrowIfNull(speechOptions);

        var kokoroOptions = MapToKokoroOptions(speechOptions);

        return await _client
            .GenerateSpeechAsync(kokoroOptions, ct)
            .ConfigureAwait(false);
    }


    private static KokoroSpeechOptions MapToKokoroOptions(SpeechOptions options)
    {
        var model = string.IsNullOrWhiteSpace(options.Model) ? "kokoro" : options.Model.Trim();
        var format = string.IsNullOrWhiteSpace(options.AudioFormat) ? "mp3" : options.AudioFormat;

        return new KokoroSpeechOptions
        {
            Input = options.Text.Trim(),
            Voice = options.Voice.Trim(),
            Model = model,
            Speed = Math.Clamp(options.Speed <= 0 ? 1.0 : options.Speed, 0.25, 4.0),
            ResponseFormat = format,
        };
    }

}
