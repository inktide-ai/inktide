using Chimera.API.Domain.Models;
using FluentValidation.Results;

namespace Chimera.API.Core;

/// <summary>
/// Chat (LLM) provider contract. No HTTP types — transport lives in Infrastructure.
/// </summary>
public interface IChatProvider : IProvider
{
    #region Properties

    /// <summary>
    /// Declared capabilities for catalog and routing.
    /// </summary>
    ChatProviderCapabilities Capabilities { get; }

    #endregion

    #region Methods

    Task<IReadOnlyList<ModelInfo>> ListModelsAsync(
        ProviderOptions options,
        CancellationToken cancellationToken = default);

    Task<ChatResponse> GenerateAsync(
        ProviderOptions options,
        ChatRequest request,
        CancellationToken cancellationToken = default);

    IAsyncEnumerable<ChatChunk> StreamAsync(
        ProviderOptions options,
        ChatRequest request,
        CancellationToken cancellationToken = default);

    #endregion
}
