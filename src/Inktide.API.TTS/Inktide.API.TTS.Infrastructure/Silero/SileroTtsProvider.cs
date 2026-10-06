using Inktide.API.Domain.Enums;
using Inktide.API.Domain.Models;
using Inktide.API.TTS.Domain.Models;
using Inktide.API.TTS.Domain.Speech;
using Inktide.API.TTS.Infrastructure.Kokoro;
using FluentValidation.Results;

namespace Inktide.API.TTS.Infrastructure.Silero;

/// <summary>
/// Russian speech from Silero v4_ru. The Silero service serves the same HTTP API as
/// Kokoro-FastAPI, so it is reached through a <see cref="KokoroTtsClient"/> pointed at its own
/// endpoint. Kokoro has no Russian voices; this is the stack's local Russian voice.
/// </summary>
public sealed class SileroTtsProvider : ISpeechProvider, IVoiceListingProvider
{
    private readonly KokoroTtsClient _client;

    public SileroTtsProvider(KokoroTtsClient client)
    {
        _client = client ?? throw new ArgumentNullException(nameof(client));
    }

    public string Id => "silero";

    public string Name => "Silero";

    public ProviderCategory Category => ProviderCategory.Speech;

    public SpeechProviderCapabilities Capabilities { get; } = new()
    {
        RequiresApiKey = false,
        SupportsVoiceListing = true,
        SupportsStreaming = false,
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

    public Task<Stream> SynthesizeAsync(
        ProviderOptions providerOptions,
        SpeechOptions speechOptions,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(providerOptions);
        ArgumentNullException.ThrowIfNull(speechOptions);

        return _client.GenerateSpeechAsync(new KokoroSpeechOptions
        {
            Input = speechOptions.Text.Trim(),
            Voice = speechOptions.Voice.Trim(),
            Model = "silero-v4-ru",
            Speed = Math.Clamp(speechOptions.Speed <= 0 ? 1.0 : speechOptions.Speed, 0.5, 2.0),
            ResponseFormat = string.IsNullOrWhiteSpace(speechOptions.AudioFormat) ? "wav" : speechOptions.AudioFormat,
        }, ct);
    }
}
