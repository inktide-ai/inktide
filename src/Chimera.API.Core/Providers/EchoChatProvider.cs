using Chimera.API.Domain.Enums;
using Chimera.API.Domain.Models;
using FluentValidation.Results;

namespace Chimera.API.Core.Providers;

/// <summary>
/// Minimal in-process provider for integration tests and local dev. Replace with real HTTP-backed implementations in Infrastructure.
/// </summary>
public sealed class EchoChatProvider : IChatProvider
{

    private readonly ChatProviderCapabilities _capabilities = new()
    {
        SupportsStreaming = true,
        SupportsTools = false,
        MaxContextTokens = 4096,
    };


    public string Id => "echo";

    public string Name => "Echo (development)";

    public ProviderCategory Category => ProviderCategory.Chat;

    public ChatProviderCapabilities Capabilities => _capabilities;


    public ValidationResult Validate(ProviderOptions options)
    {
        _ = options;
        return new ValidationResult();
    }

    public Task<IReadOnlyList<ModelInfo>> ListModelsAsync(
        ProviderOptions options,
        CancellationToken cancellationToken = default)
    {
        _ = options;
        IReadOnlyList<ModelInfo> models =
        [
            new ModelInfo { Id = "echo", Name = "echo" },
        ];
        return Task.FromResult(models);
    }

    public Task<ChatResponse> GenerateAsync(
        ProviderOptions options,
        ChatRequest request,
        CancellationToken cancellationToken = default)
    {
        _ = options;
        var last = request.Messages.Count > 0
            ? request.Messages[^1].Content
            : string.Empty;
        var response = new ChatResponse
        {
            Text = $"Echo [{Id}]: {last}",
            Model = request.Model,
        };
        return Task.FromResult(response);
    }

    public async IAsyncEnumerable<ChatChunk> StreamAsync(
        ProviderOptions options,
        ChatRequest request,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        _ = options;
        await Task.Yield();
        var last = request.Messages.Count > 0
            ? request.Messages[^1].Content
            : string.Empty;
        yield return new ChatChunk { Delta = $"Echo [{Id}]: ", IsFinished = false };
        yield return new ChatChunk { Delta = last, IsFinished = false };
        yield return new ChatChunk { IsFinished = true };
    }

}
