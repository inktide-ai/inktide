using Inktide.API.Domain.Enums;
using Inktide.API.Domain.Models;
using Inktide.API.TTS.Domain.Models;
using Inktide.API.TTS.Domain.Speech;
using FluentValidation.Results;
using Microsoft.Extensions.Options;

namespace Inktide.API.TTS.Infrastructure.OpenAi;

/// <summary>
/// OpenAI-compatible TTS provider (any server that speaks the OpenAI Audio API format).
/// Base URL is configured per-deployment; model is free text.
/// </summary>
public sealed class OpenAiCompatibleTtsProvider : ISpeechProvider
{
    private readonly IOptions<OpenAiCompatibleTtsSettings> _settings;

    public OpenAiCompatibleTtsProvider(IOptions<OpenAiCompatibleTtsSettings> settings)
    {
        _settings = settings ?? throw new ArgumentNullException(nameof(settings));
    }

    public string Id => "openai-compatible";

    public string Name => "OpenAI Compatible";

    public ProviderCategory Category => ProviderCategory.Speech;

    public SpeechProviderCapabilities Capabilities { get; } = new()
    {
        RequiresApiKey = true,
        SupportsVoiceListing = false,
        SupportsStreaming = false,
    };

    public ValidationResult Validate(ProviderOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        var result = new ValidationResult();

        if (string.IsNullOrWhiteSpace(options.ApiKey))
        {
            result.Errors.Add(new ValidationFailure(nameof(options.ApiKey),
                "OpenAI Compatible TTS requires an API key."));
        }

        if (_settings.Value.Endpoint is null)
        {
            result.Errors.Add(new ValidationFailure(nameof(_settings.Value.Endpoint),
                "OpenAI Compatible TTS requires a Base URL (TtsProviders:OpenAiCompatible:Endpoint)."));
        }

        return result;
    }

    public Task<SpeechVoiceCollection> GetVoicesAsync(
        ProviderOptions options,
        string? modelId = null,
        CancellationToken ct = default)
    {
        return Task.FromResult(new SpeechVoiceCollection([]));
    }

    public Task<SpeechModelCollection> GetModelsAsync(
        ProviderOptions options,
        CancellationToken ct = default)
    {
        return Task.FromResult(new SpeechModelCollection("list", []));
    }

    public async Task<Stream> SynthesizeAsync(
        ProviderOptions providerOptions,
        SpeechOptions speechOptions,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(providerOptions);
        ArgumentNullException.ThrowIfNull(speechOptions);

        var apiKey = providerOptions.ApiKey
            ?? throw new InvalidOperationException("OpenAI Compatible TTS API key is required.");

        var endpoint = _settings.Value.Endpoint
            ?? throw new InvalidOperationException(
                "OpenAI Compatible TTS requires a Base URL (TtsProviders:OpenAiCompatible:Endpoint).");

        var modelId = !string.IsNullOrWhiteSpace(speechOptions.Model)
            ? speechOptions.Model
            : _settings.Value.DefaultModelId;

        return await OpenAiTtsProvider.GenerateSpeechAsync(
            endpoint, apiKey, modelId, speechOptions, ct)
            .ConfigureAwait(false);
    }
}
