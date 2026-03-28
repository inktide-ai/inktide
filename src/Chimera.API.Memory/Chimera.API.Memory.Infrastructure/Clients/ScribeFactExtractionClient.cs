using System.Net.Http.Json;
using Chimera.API.Memory.Domain.Models;
using Chimera.API.Memory.Domain.Ports;

namespace Chimera.API.Memory.Infrastructure.Clients;

public sealed class ScribeFactExtractionClient : IFactExtractionClient
{
    public const string HttpClientName = "scribe-extract";

    private readonly IHttpClientFactory _factory;

    public ScribeFactExtractionClient(IHttpClientFactory factory)
        => _factory = factory;

    public async Task<IReadOnlyList<ExtractedFact>> ExtractFactsAsync(
        MemoryIngestionJob job,
        CancellationToken ct = default)
    {
        var body = new ConversationTurnRequest
        {
            UserMessage = new UserMessageDto
            {
                Sender = job.SenderName,
                Text = job.UserMessage
            },
            BotResponse = job.BotResponse,
            Platform = job.Platform,
            ChannelId = job.ChannelId,
            Timestamp = job.Timestamp
        };

        var client = _factory.CreateClient(HttpClientName);
        using var response = await client.PostAsJsonAsync("/api/v1/extract-facts", body, ct);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<FactExtractionResponseDto>(ct);
        return result!.Facts
            .Select(f => new ExtractedFact(f.Text, f.Type, f.Entities, f.Importance))
            .ToList();
    }
}
