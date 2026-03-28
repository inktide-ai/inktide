using Chimera.API.Domain.Enums;
using Chimera.API.Domain.Models;
using Chimera.API.TTS.Domain.Models;
using Chimera.API.TTS.Domain.Speech;
using FluentValidation.Results;
using Microsoft.Extensions.Logging;

namespace Chimera.API.TTS.Infrastructure.Decorators;

/// <summary>
/// Cross-cutting logging around a concrete speech (TTS) provider.
/// </summary>
public sealed class LoggingSpeechProviderDecorator : ISpeechProvider
{
    #region Fields

    private readonly ISpeechProvider _inner;
    private readonly ILogger _logger;

    #endregion

    #region Constructors

    public LoggingSpeechProviderDecorator(
        ISpeechProvider inner,
        ILogger logger)
    {
        _inner = inner ?? throw new ArgumentNullException(nameof(inner));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #endregion

    #region Properties

    public string Id => _inner.Id;

    public string Name => _inner.Name;

    public ProviderCategory Category => _inner.Category;

    public SpeechProviderCapabilities Capabilities => _inner.Capabilities;

    #endregion

    #region Public Methods

    public ValidationResult Validate(ProviderOptions options)
    {
        _logger.LogDebug("Validating speech provider options for {ProviderId}", Id);
        return _inner.Validate(options);
    }

    public Task<SpeechModelCollection> GetModelsAsync(
        ProviderOptions options,
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("GetModelsAsync {ProviderId}", Id);
        return _inner.GetModelsAsync(options, cancellationToken);
    }

    public Task<SpeechVoiceCollection> GetVoicesAsync(
        ProviderOptions options,
        string? modelId = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("GetVoicesAsync {ProviderId} model {ModelId}", Id, modelId);
        return _inner.GetVoicesAsync(options, modelId, cancellationToken);
    }

    public async Task<Stream> SynthesizeAsync(
        ProviderOptions providerOptions,
        SpeechOptions speechOptions,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "SynthesizeAsync start {ProviderId} voice {Voice} model {Model}",
            Id,
            speechOptions.Voice,
            speechOptions.Model);
        try
        {
            var stream = await _inner.SynthesizeAsync(
                    providerOptions, speechOptions, cancellationToken)
                .ConfigureAwait(false);
            _logger.LogInformation(
                "SynthesizeAsync returned stream {ProviderId} (HTTP body may still be transferring to the client)",
                Id);
            return stream;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SynthesizeAsync failed {ProviderId}", Id);
            throw;
        }
    }

    #endregion
}
