using Chimera.API.Domain.Enums;
using Chimera.API.Domain.Models;
using FluentValidation.Results;
using Microsoft.Extensions.Logging;

namespace Chimera.API.Core.Decorators;

/// <summary>
/// Cross-cutting logging around a concrete chat provider. Keeps transport and business logic in inner implementation.
/// </summary>
public sealed class LoggingChatProviderDecorator : IChatProvider
{
    #region Fields

    private readonly IChatProvider _inner;
    private readonly ILogger _logger;

    #endregion

    #region Constructors

    public LoggingChatProviderDecorator(
        IChatProvider inner,
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

    public ChatProviderCapabilities Capabilities => _inner.Capabilities;

    #endregion

    #region Public Methods

    public ValidationResult Validate(ProviderOptions options)
    {
        _logger.LogDebug("Validating provider options for {ProviderId}", Id);
        return _inner.Validate(options);
    }

    public Task<IReadOnlyList<ModelInfo>> ListModelsAsync(
        ProviderOptions options,
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("ListModelsAsync {ProviderId}", Id);
        return _inner.ListModelsAsync(options, cancellationToken);
    }

    public async Task<ChatResponse> GenerateAsync(
        ProviderOptions options,
        ChatRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("GenerateAsync start {ProviderId} model {Model}", Id, request.Model);
        try
        {
            var response = await _inner.GenerateAsync(options, request, cancellationToken).ConfigureAwait(false);
            _logger.LogInformation("GenerateAsync end {ProviderId}", Id);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GenerateAsync failed {ProviderId}", Id);
            throw;
        }
    }

    public async IAsyncEnumerable<ChatChunk> StreamAsync(
        ProviderOptions options,
        ChatRequest request,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("StreamAsync start {ProviderId} model {Model}", Id, request.Model);
        await foreach (var chunk in _inner.StreamAsync(options, request, cancellationToken).ConfigureAwait(false))
        {
            yield return chunk;
        }

        _logger.LogDebug("StreamAsync end {ProviderId}", Id);
    }

    #endregion
}
