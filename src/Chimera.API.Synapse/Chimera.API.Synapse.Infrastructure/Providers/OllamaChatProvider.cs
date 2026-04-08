using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using Chimera.API.Core;
using Chimera.API.Domain.Enums;
using Chimera.API.Domain.Models;
using FluentValidation.Results;

namespace Chimera.API.Synapse.Infrastructure.Providers;

/// <summary>
/// Chat provider backed by a local Ollama server.
/// Only <see cref="ListModelsAsync"/> is implemented here — inference goes through the Synapse pipeline.
/// </summary>
public sealed class OllamaChatProvider : IChatProvider
{
    #region Fields

    private readonly HttpClient _http;

    private static readonly ChatProviderCapabilities _capabilities = new()
    {
        SupportsStreaming = true,
        SupportsTools = false,
        MaxContextTokens = 128_000,
    };

    #endregion

    #region Constructors

    public OllamaChatProvider(HttpClient http)
    {
        _http = http ?? throw new ArgumentNullException(nameof(http));
    }

    #endregion

    #region Properties

    public string Id => "ollama";
    public string Name => "Ollama";
    public ProviderCategory Category => ProviderCategory.Chat;
    public ChatProviderCapabilities Capabilities => _capabilities;

    #endregion

    #region Public Methods

    public ValidationResult Validate(ProviderOptions options) => new();

    public async Task<IReadOnlyList<ModelInfo>> ListModelsAsync(
        ProviderOptions options,
        CancellationToken cancellationToken = default)
    {
        var baseUrl = (options.BaseUrl ?? "http://localhost:11434").TrimEnd('/');
        var response = await _http
            .GetFromJsonAsync<OllamaTagsResponse>($"{baseUrl}/api/tags", cancellationToken)
            .ConfigureAwait(false);

        if (response?.Models is null)
            return [];

        return response.Models
            .Select(m => new ModelInfo { Id = m.Name, Name = m.Name })
            .OrderBy(m => m.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public Task<ChatResponse> GenerateAsync(
        ProviderOptions options,
        ChatRequest request,
        CancellationToken cancellationToken = default)
        => throw new NotSupportedException("Ollama inference runs through the Synapse pipeline, not direct provider calls.");

    public async IAsyncEnumerable<ChatChunk> StreamAsync(
        ProviderOptions options,
        ChatRequest request,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException("Ollama inference runs through the Synapse pipeline, not direct provider calls.");
        yield break;
    }

    #endregion

    #region Private Types

    private sealed class OllamaTagsResponse
    {
        public List<OllamaModelEntry>? Models { get; set; }
    }

    private sealed class OllamaModelEntry
    {
        public string Name { get; set; } = string.Empty;
    }

    #endregion
}
