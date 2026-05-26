using Inktide.API.Domain.Enums;
using Inktide.API.Domain.Models;
using Inktide.API.TTS.Domain.Models;
using Inktide.API.TTS.Domain.Speech;
using FluentValidation.Results;
using Microsoft.Extensions.Options;

namespace Inktide.API.TTS.Infrastructure.OpenAi;

/// <summary>
/// Official OpenAI TTS (api.openai.com) as <see cref="ISpeechProvider"/>.
/// Requires an API key supplied via <c>X-TTS-Api-Key</c> header or
/// <c>TtsProviders:OpenAi:ApiKey</c> config.
/// </summary>
public sealed class OpenAiTtsProvider : ISpeechProvider, IVoiceListingProvider, IModelListingProvider
{
    private static readonly Uri OpenAiEndpoint = new("https://api.openai.com/v1");

    private static readonly SpeechModelCollection KnownModels = new("list",
    [
        new("tts-1",             "tts-1",             DateTimeOffset.UnixEpoch, "openai"),
        new("tts-1-hd",         "tts-1-hd",         DateTimeOffset.UnixEpoch, "openai"),
        new("gpt-4o-mini-tts",  "gpt-4o-mini-tts",  DateTimeOffset.UnixEpoch, "openai"),
    ]);

    private readonly OpenAiTtsClient _client;
    private readonly IOptions<OpenAiTtsSettings> _settings;

    public OpenAiTtsProvider(OpenAiTtsClient client, IOptions<OpenAiTtsSettings> settings)
    {
        _client   = client   ?? throw new ArgumentNullException(nameof(client));
        _settings = settings ?? throw new ArgumentNullException(nameof(settings));
    }

    public string Id => "openai";

    public string Name => "OpenAI";

    public ProviderCategory Category => ProviderCategory.Speech;

    public SpeechProviderCapabilities Capabilities { get; } = new()
    {
        RequiresApiKey       = true,
        SupportsVoiceListing = true,
        SupportsStreaming     = false,
        SupportsModelListing  = true,
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

        return await _client
            .SynthesizeAsync(OpenAiEndpoint, apiKey, modelId, speechOptions, cacheClient: !providerOptions.ApiKeyIsTransient, ct)
            .ConfigureAwait(false);
    }
}
