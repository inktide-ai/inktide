using System.Net.Http.Json;
using Inktide.API.Memory.Domain.Models;
using Inktide.API.Memory.Domain.Ports;

namespace Inktide.API.Memory.Infrastructure.Clients;

public sealed class ScribeFactExtractionClient : IFactExtractionClient
{
    public const string HttpClientName = "scribe-extract";

    private readonly HttpClient _client;

    public ScribeFactExtractionClient(IHttpClientFactory factory)
    {
        _client = factory.CreateClient(HttpClientName);
    }

    public async Task<IReadOnlyList<ExtractedFact>> ExtractFactsAsync(
        MemoryIngestionJob job,
        CancellationToken ct = default)
    {
        var body = new ConversationTurnRequest
        {
            UserMessage = new UserMessage
            {
                Sender = job.SenderName,
                Text = job.UserMessage
            },
            BotResponse = job.BotResponse,
            Platform = job.Platform,
            ChannelId = job.ChannelId,
            Timestamp = job.Timestamp
        };
        
        using var response = await _client.PostAsJsonAsync("/api/v1/extract-facts", body, ct);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<FactExtractionResponse>(ct);
        return result!.Facts
            .Select(f => new ExtractedFact(f.Text, f.Type, f.Entities, f.Importance))
            .ToList();
    }
}
