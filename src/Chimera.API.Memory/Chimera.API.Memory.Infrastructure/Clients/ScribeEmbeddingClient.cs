using System.Net.Http.Json;
using Chimera.API.Memory.Domain.Ports;

namespace Chimera.API.Memory.Infrastructure.Clients;

public sealed class ScribeEmbeddingClient : IEmbeddingClient
{
    public const string HttpClientName = "scribe-embed";

    private readonly IHttpClientFactory _factory;

    public ScribeEmbeddingClient(IHttpClientFactory factory)
        => _factory = factory;

    public async Task<float[]> EmbedAsync(string text, CancellationToken ct = default)
    {
        var client = _factory.CreateClient(HttpClientName);
        using var response = await client.PostAsJsonAsync("/api/v1/embed", new EmbedRequest { Text = text }, ct);
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<EmbedResponse>(ct);
        return result!.Embedding;
    }

    public async Task<IReadOnlyList<float[]>> EmbedBatchAsync(IReadOnlyList<string> texts, CancellationToken ct = default)
    {
        var client = _factory.CreateClient(HttpClientName);
        using var response = await client.PostAsJsonAsync(
            "/api/v1/embed/batch",
            new EmbedBatchRequest { Texts = [..texts] },
            ct);
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<EmbedBatchResponse>(ct);
        return result!.Embeddings;
    }
}
