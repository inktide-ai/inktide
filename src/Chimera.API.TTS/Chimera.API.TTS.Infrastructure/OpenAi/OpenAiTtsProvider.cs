using Chimera.API.Domain.Enums;
using Chimera.API.Domain.Models;
using Chimera.API.TTS.Domain.Models;
using Chimera.API.TTS.Domain.Speech;
using FluentValidation.Results;
using Microsoft.Extensions.Options;
using OpenAI.Audio;
using System.ClientModel;

namespace Chimera.API.TTS.Infrastructure.OpenAi;

/// <summary>
/// Official OpenAI TTS (api.openai.com) as <see cref="ISpeechProvider"/>.
/// Requires an API key supplied via <c>X-TTS-Api-Key</c> header or
/// <c>TtsProviders:OpenAi:ApiKey</c> config.
/// </summary>
public sealed class OpenAiTtsProvider : ISpeechProvider
{
    private static readonly Uri OpenAiEndpoint = new("https://api.openai.com/v1");

    private static readonly SpeechModelCollection KnownModels = new("list",
    [
        new("tts-1",             "tts-1",             DateTimeOffset.UnixEpoch, "openai"),
        new("tts-1-hd",         "tts-1-hd",         DateTimeOffset.UnixEpoch, "openai"),
        new("gpt-4o-mini-tts",  "gpt-4o-mini-tts",  DateTimeOffset.UnixEpoch, "openai"),
    ]);

    private readonly IOptions<OpenAiTtsSettings> _settings;

    public OpenAiTtsProvider(IOptions<OpenAiTtsSettings> settings)
    {
        _settings = settings ?? throw new ArgumentNullException(nameof(settings));
    }

    public string Id => "openai";

    public string Name => "OpenAI";

    public ProviderCategory Category => ProviderCategory.Speech;

    public SpeechProviderCapabilities Capabilities { get; } = new()
    {
        RequiresApiKey = true,
        SupportsVoiceListing = true,
        SupportsStreaming = false,
    };

    public ValidationResult Validate(ProviderOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        var result = new ValidationResult();

        if (string.IsNullOrWhiteSpace(options.ApiKey))
        {
            result.Errors.Add(new ValidationFailure(nameof(options.ApiKey),
                "OpenAI TTS requires an API key."));
        }

        return result;
    }

    public Task<SpeechVoiceCollection> GetVoicesAsync(
        ProviderOptions options,
        string? modelId = null,
        CancellationToken ct = default)
    {
        return Task.FromResult(OpenAiSpeechVoice.ToCollection());
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
            ?? throw new InvalidOperationException("OpenAI TTS API key is required.");

        var modelId = !string.IsNullOrWhiteSpace(speechOptions.Model)
            ? speechOptions.Model
            : _settings.Value.DefaultModelId;

        return await GenerateSpeechAsync(
            OpenAiEndpoint, apiKey, modelId, speechOptions, ct)
            .ConfigureAwait(false);
    }

    internal static async Task<Stream> GenerateSpeechAsync(
        Uri endpoint,
        string apiKey,
        string modelId,
        SpeechOptions speechOptions,
        CancellationToken ct)
    {
        var client = new AudioClient(
            model: modelId,
            credential: new ApiKeyCredential(apiKey),
            options: new OpenAI.OpenAIClientOptions { Endpoint = endpoint });

        var options = new SpeechGenerationOptions
        {
            SpeedRatio = (float)Math.Clamp(
                speechOptions.Speed <= 0 ? 1.0 : speechOptions.Speed, 0.25, 4.0),
            ResponseFormat = MapFormat(speechOptions.AudioFormat),
        };

        var result = await client
            .GenerateSpeechAsync(
                speechOptions.Text,
                new GeneratedSpeechVoice(speechOptions.Voice),
                options,
                ct)
            .ConfigureAwait(false);

        return result.Value.ToStream();
    }

    private static GeneratedSpeechFormat MapFormat(string? audioFormat)
        => audioFormat?.ToLowerInvariant() switch
        {
            "mp3"  => GeneratedSpeechFormat.Mp3,
            "opus" => GeneratedSpeechFormat.Opus,
            "aac"  => GeneratedSpeechFormat.Aac,
            "flac" => GeneratedSpeechFormat.Flac,
            "pcm"  => GeneratedSpeechFormat.Pcm,
            "wav"  => GeneratedSpeechFormat.Wav,
            _      => GeneratedSpeechFormat.Mp3,
        };
}
