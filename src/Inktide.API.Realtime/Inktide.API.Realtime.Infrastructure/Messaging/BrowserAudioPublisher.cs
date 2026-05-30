#pragma warning disable CA1869 // cached JsonElement is read-only pass-through
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
/// Consumes synthesized audio payloads from <c>synapse.tts.ready</c> and pushes them
/// to browser clients subscribed to the relevant channel via <see cref="AudioHub"/>.
/// </summary>
public sealed class BrowserAudioPublisher
    : RedisStreamPublisherBase<BrowserAudioPublisher.TtsReadyPayload, RealtimeStreamSettings>
{
    public sealed record TtsReadyPayload(
        [property: JsonPropertyName("correlationId")]   string        CorrelationId,
        [property: JsonPropertyName("channelId")]       string        ChannelId,
        [property: JsonPropertyName("platformId")]      string        PlatformId,
        [property: JsonPropertyName("audioBase64")]     string        AudioBase64,
        [property: JsonPropertyName("contentType")]     string        ContentType,
        [property: JsonPropertyName("llmModel")]        string        LlmModel,
        /// <summary>
        /// Rhubarb viseme timeline, or <c>null</c> when Rhubarb is unavailable.
        /// Passed through opaquely as a raw JSON element — no Realtime-layer parsing needed.
        /// </summary>
        [property: JsonPropertyName("visemeTimeline")]  JsonElement?  VisemeTimeline,
        [property: JsonPropertyName("emotionId")]        string?       EmotionId        = null,
        [property: JsonPropertyName("emotionIntensity")] float         EmotionIntensity = 0f,
        // SoulState — VAD vector and PhysicalState forwarded from LlmStreamWorker
        [property: JsonPropertyName("vadV")]      float VadV      = 0f,
        [property: JsonPropertyName("vadA")]      float VadA      = 0f,
        [property: JsonPropertyName("vadD")]      float VadD      = 0f,
        [property: JsonPropertyName("energy")]    float Energy    = 1f,
        [property: JsonPropertyName("attention")] float Attention = 0f,
        [property: JsonPropertyName("comfort")]   float Comfort   = 0.5f);


    public BrowserAudioPublisher(
        IConnectionMultiplexer redis,
        IHubContext<AudioHub> hub,
        IOptions<RealtimeStreamSettings> settings,
        ILogger<BrowserAudioPublisher> logger)
        : base(redis, hub, settings, logger) { }


    protected override TtsReadyPayload? Deserialize(string json)
        => JsonSerializer.Deserialize<TtsReadyPayload>(json);

    protected override bool IsValid(TtsReadyPayload payload)
        => !string.IsNullOrWhiteSpace(payload.AudioBase64);

    protected override async Task PushToClientsAsync(TtsReadyPayload payload, CancellationToken ct)
    {
        var group = RealtimeConstants.Groups.ChannelKey(payload.ChannelId);

        await Hub.Clients.Group(group).SendAsync(
            RealtimeConstants.HubMethods.AudioReceived,
            new
            {
                correlationId    = payload.CorrelationId,
                audioBase64      = payload.AudioBase64,
                contentType      = payload.ContentType,
                visemeTimeline   = payload.VisemeTimeline,  // null → frontend uses formant fallback
                emotion          = payload.EmotionId,
                emotionIntensity = payload.EmotionIntensity,
                // SoulState sent to all frontend animation controllers
                vad = new { v = payload.VadV, a = payload.VadA, d = payload.VadD },
                physical = new
                {
                    energy    = payload.Energy,
                    attention = payload.Attention,
                    comfort   = payload.Comfort,
                },
            },
            ct);

        Logger.LogDebug(
            "Audio pushed to SignalR. Channel={Channel} Correlation={Correlation} emotion={Emotion} vad=({V:F2},{A:F2},{D:F2})",
            payload.ChannelId, payload.CorrelationId, payload.EmotionId ?? "-",
            payload.VadV, payload.VadA, payload.VadD);
    }
}
