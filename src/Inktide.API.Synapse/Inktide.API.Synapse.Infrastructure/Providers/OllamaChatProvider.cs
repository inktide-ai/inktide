using System.Net.Http.Json;
using Inktide.API.Core;
using Inktide.API.Domain.Enums;
using Inktide.API.Domain.Models;
using FluentValidation.Results;

namespace Inktide.API.Synapse.Infrastructure.Providers;

/// <summary>
/// Chat provider backed by a local Ollama server.
/// Only <see cref="ListModelsAsync"/> is implemented here — inference goes through the Synapse pipeline.
/// </summary>
internal sealed class OllamaChatProvider : IChatProvider
{

    private readonly HttpClient _http;

    private static readonly ChatProviderCapabilities _capabilities = new()
    {
        SupportsStreaming = true,
        SupportsTools = false,
        MaxContextTokens = 128_000,
    };


    public OllamaChatProvider(HttpClient http)
    {
        _http = http ?? throw new ArgumentNullException(nameof(http));
    }


    public string Id => "ollama";
    public string Name => "Ollama";
    public ProviderCategory Category => ProviderCategory.Chat;
    public ChatProviderCapabilities Capabilities => _capabilities;


    public ValidationResult Validate(ProviderOptions options) => new();

    public async Task<IReadOnlyList<ModelInfo>> ListModelsAsync(
        ProviderOptions options,
        CancellationToken cancellationToken = default)
    {
        var baseUrl = System.Text.RegularExpressions.Regex.Replace(
            (options.BaseUrl ?? "http://localhost:11434").TrimEnd('/'),
            @"/v1/?$", string.Empty, System.Text.RegularExpressions.RegexOptions.IgnoreCase);
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

    public IAsyncEnumerable<ChatChunk> StreamAsync(
        ProviderOptions options,
        ChatRequest request,
        CancellationToken cancellationToken = default)
        => throw new NotSupportedException("Ollama inference runs through the Synapse pipeline, not direct provider calls.");


    private sealed class OllamaTagsResponse
    {
        public List<OllamaModelEntry>? Models { get; set; }
    }

    private sealed class OllamaModelEntry
    {
        public string Name { get; set; } = string.Empty;
    }

}
