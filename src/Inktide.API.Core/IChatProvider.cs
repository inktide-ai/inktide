using Inktide.API.Domain.Models;
using FluentValidation.Results;

namespace Inktide.API.Core;

public interface IChatProvider : IProvider
{
    ChatProviderCapabilities Capabilities { get; }


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

}
