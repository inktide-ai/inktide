using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Chimera.AI.Orchestrator.Application.Contracts;
using Chimera.AI.Orchestrator.Infrastructure.Settings;

namespace Chimera.AI.Orchestrator.Infrastructure.Ollama;

/// <summary>
/// Generates embeddings by calling the local Ollama /api/embed endpoint.
/// Supports both single-text and batch embedding.
/// </summary>
public sealed class OllamaEmbeddingProvider : IEmbeddingProvider
{
    private readonly HttpClient _httpClient;
    private readonly OllamaSettings _settings;
    private readonly ILogger<OllamaEmbeddingProvider> _logger;

    public OllamaEmbeddingProvider(
        HttpClient httpClient,
        IOptions<OllamaSettings> settings,
        ILogger<OllamaEmbeddingProvider> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;

        _httpClient.BaseAddress = new Uri(_settings.BaseUrl);
        _httpClient.Timeout = TimeSpan.FromSeconds(30);
    }

    public async Task<float[]> EmbedAsync(string text, CancellationToken ct = default)
    {
        var results = await EmbedBatchAsync([text], ct);
        return results[0];
    }

    public async Task<IReadOnlyList<float[]>> EmbedBatchAsync(
        IReadOnlyList<string> texts,
        CancellationToken ct = default)
    {
        var request = new EmbedRequest
        {
            Model = _settings.EmbeddingModel,
            Input = texts.ToList()
        };

        var response = await _httpClient.PostAsJsonAsync("/api/embed", request, ct);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<EmbedResponse>(ct)
                     ?? throw new InvalidOperationException("Ollama /api/embed returned null");

        if (result.Embeddings is null || result.Embeddings.Count != texts.Count)
            throw new InvalidOperationException(
                $"Expected {texts.Count} embeddings, got {result.Embeddings?.Count ?? 0}");

        _logger.LogDebug(
            "Ollama embedded {Count} text(s), model={Model}, dim={Dim}",
            texts.Count, _settings.EmbeddingModel, result.Embeddings[0].Length);

        return result.Embeddings;
    }

    private sealed class EmbedRequest
    {
        [JsonPropertyName("model")]
        public string Model { get; set; } = string.Empty;

        [JsonPropertyName("input")]
        public List<string> Input { get; set; } = [];
    }

    private sealed class EmbedResponse
    {
        [JsonPropertyName("model")]
        public string? Model { get; set; }

        [JsonPropertyName("embeddings")]
        public List<float[]>? Embeddings { get; set; }
    }
}
