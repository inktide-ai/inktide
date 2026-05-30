using System.Text.Json;
using Inktide.API.TTS.Application.Abstractions;
using Inktide.API.TTS.Application.Configuration;
using Inktide.API.TTS.Infrastructure.LipSync;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Inktide.API.TTS.Infrastructure.Messaging;

/// <summary>
/// Runs Rhubarb lip-sync analysis, serializes the audio payload, and publishes it to
/// <c>synapse.tts.ready</c> via Redis Streams.
/// </summary>
public sealed class RedisTtsAudioPublisher : ITtsAudioPublisher
{

    private readonly IConnectionMultiplexer _redis;
    private readonly IRhubarbService _rhubarb;
    private readonly TtsOutputStreamSettings _settings;
    private readonly ILogger<RedisTtsAudioPublisher> _logger;


    public RedisTtsAudioPublisher(
        IConnectionMultiplexer redis,
        IRhubarbService rhubarb,
        IOptions<TtsOutputStreamSettings> settings,
        ILogger<RedisTtsAudioPublisher> logger)
    {
        _redis    = redis    ?? throw new ArgumentNullException(nameof(redis));
        _rhubarb  = rhubarb  ?? throw new ArgumentNullException(nameof(rhubarb));
        _settings = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
        _logger   = logger   ?? throw new ArgumentNullException(nameof(logger));
    }


    public async Task PublishAsync(TtsAudioPayload payload, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(payload);

        var audioBase64 = Convert.ToBase64String(payload.WavBytes);

        var visemeTimeline = await _rhubarb.AnalyzeAsync(payload.WavBytes, ct);

        var json = JsonSerializer.Serialize(new
        {
            correlationId    = payload.CorrelationId,
            channelId        = payload.ChannelId,
            platformId       = payload.PlatformId,
            sequenceNumber   = payload.SequenceNumber,
            isLast           = payload.IsLast,
            audioBase64,
            contentType      = payload.ContentType,
            llmModel         = payload.LlmModel,
            visemeTimeline,
            emotionId        = payload.EmotionId,
            emotionIntensity = payload.EmotionIntensity,
            // SoulState pass-through
            vadV      = payload.VadV,
            vadA      = payload.VadA,
            vadD      = payload.VadD,
            energy    = payload.Energy,
            attention = payload.Attention,
            comfort   = payload.Comfort,
        });

        var db = _redis.GetDatabase();
        // SE.Redis does not support CancellationToken on StreamAddAsync.
        // Configure syncTimeout/connectTimeout on ConnectionMultiplexer to bound hang time.
        await db.StreamAddAsync(
            _settings.StreamName,
            [new NameValueEntry(_settings.PayloadFieldName, json)],
            maxLength: _settings.ApproximateMaxLength,
            useApproximateMaxLength: true);

        _logger.LogInformation(
            "TTS audio published. Channel={Channel} Correlation={Correlation} Seq={Seq} IsLast={IsLast} Bytes={Bytes}",
            payload.ChannelId, payload.CorrelationId, payload.SequenceNumber, payload.IsLast, payload.WavBytes.Length);
    }

}
