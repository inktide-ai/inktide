using System.Text.Json;
using System.Text.Json.Serialization;
using Inktide.API.Realtime.Infrastructure.Configuration;
using Inktide.API.Realtime.Infrastructure.Constants;
using Inktide.API.Realtime.Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Inktide.API.Realtime.Infrastructure.Messaging;

/// <summary>
/// Consumes LLM text chunks from <c>synapse.llm.response</c> and pushes them to browser
/// clients as <c>textChunk</c> SignalR events via <see cref="AudioHub"/>.
///
/// <para>Runs a separate consumer group (<c>text-delivery-workers</c>) on the same Redis stream
/// that the TTS pipeline also reads — Redis Streams fan-out per group, so the two pipelines
/// are fully independent.</para>
///
/// <para>Delivery guarantee: at-least-once (ACK after SendAsync). Duplicate chunks are
/// idempotent on the frontend via <c>sequenceNumber</c> dedup.</para>
/// </summary>
public sealed class BrowserTextPublisher
    : RedisStreamPublisherBase<BrowserTextPublisher.LlmChunkPayload, RealtimeTextStreamSettings>
{
    public sealed record LlmChunkPayload(
        [property: JsonPropertyName("correlationId")]   string CorrelationId,
        [property: JsonPropertyName("channelId")]       string ChannelId,
        [property: JsonPropertyName("text")]            string Text,
        [property: JsonPropertyName("sequenceNumber")]  int    SequenceNumber,
        [property: JsonPropertyName("isLast")]          bool   IsLast);


    public BrowserTextPublisher(
        IConnectionMultiplexer redis,
        IHubContext<AudioHub> hub,
        IOptions<RealtimeTextStreamSettings> settings,
        ILogger<BrowserTextPublisher> logger)
        : base(redis, hub, settings, logger) { }


    protected override LlmChunkPayload? Deserialize(string json)
        => JsonSerializer.Deserialize<LlmChunkPayload>(json);

    protected override bool IsValid(LlmChunkPayload payload)
        => !string.IsNullOrWhiteSpace(payload.ChannelId);

    protected override async Task PushToClientsAsync(LlmChunkPayload payload, CancellationToken ct)
    {
        var group = RealtimeConstants.Groups.ChannelKey(payload.ChannelId);

        await Hub.Clients.Group(group).SendAsync(
            RealtimeConstants.HubMethods.TextChunk,
            new
            {
                correlationId  = payload.CorrelationId,
                text           = payload.Text,
                sequenceNumber = payload.SequenceNumber,
                isLast         = payload.IsLast,
            },
            ct);

        Logger.LogDebug(
            "textChunk pushed. Channel={Channel} Seq={Seq} IsLast={IsLast} Correlation={Correlation}",
            payload.ChannelId, payload.SequenceNumber, payload.IsLast, payload.CorrelationId);
    }
}
