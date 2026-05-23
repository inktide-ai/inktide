using Inktide.API.Core.Generators;
using System.Text.Json;
using System.Text.Json.Serialization;
using Inktide.API.TTS.Application.Configuration;
using Inktide.API.TTS.Application.Synthesis;
using Inktide.API.TTS.Infrastructure.LipSync;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Inktide.API.TTS.Infrastructure.Messaging;

/// <summary>
/// Consumes LLM text responses from <c>synapse.llm.response</c>, synthesizes audio via TTS,
/// and publishes audio payloads to <c>synapse.tts.ready</c> for the Publisher Worker.
///
/// Bounded context responsibility: the TTS context owns the full synthesis pipeline —
/// it independently reads from the stream, calls Kokoro, and publishes the result.
/// No other module needs to orchestrate this step.
/// </summary>
public sealed class LlmResponseStreamConsumer : BackgroundService
{

    /// <summary>
    /// JSON shape published by the Python llm-worker to <c>synapse.llm.response</c>.
    /// The worker emits one message per sentence chunk; <see cref="SequenceNumber"/> is zero-based
    /// and <see cref="IsLast"/> marks the final chunk so downstream consumers know the response is complete.
    /// </summary>
    private sealed record LlmResponse(
        [property: JsonPropertyName("correlationId")]  string  CorrelationId,
        [property: JsonPropertyName("channelId")]      string  ChannelId,
        [property: JsonPropertyName("platformId")]     string  PlatformId,
        [property: JsonPropertyName("text")]           string  Text,
        [property: JsonPropertyName("model")]          string  Model,
        [property: JsonPropertyName("sequenceNumber")] int     SequenceNumber,
        [property: JsonPropertyName("isLast")]         bool    IsLast,
        /// <summary>Voice id resolved by the Python worker from the ContextShardPayload. Null = use default.</summary>
        [property: JsonPropertyName("voiceId")]        string? VoiceId,
        /// <summary>TTS provider id. Null = use configured default provider.</summary>
        [property: JsonPropertyName("ttsProviderId")]  string? TtsProviderId,
        /// <summary>TTS model override. Null = provider default.</summary>
        [property: JsonPropertyName("ttsModelId")]     string? TtsModelId,
        /// <summary>Speech speed. Null = 1.0.</summary>
        [property: JsonPropertyName("ttsSpeed")]       float?  TtsSpeed,
        /// <summary>Emotion the avatar should express. Null = no reaction.</summary>
        [property: JsonPropertyName("emotionId")]        string? EmotionId        = null,
        /// <summary>Emotion intensity 0.0–1.0.</summary>
        [property: JsonPropertyName("emotionIntensity")] float   EmotionIntensity = 0f,
        /// <summary>Speed multiplier from personality emotion responsiveness. Applied on top of TtsSpeed. Default 1.0 = no change.</summary>
        [property: JsonPropertyName("ttsSpeedModifier")]  float  TtsSpeedModifier  = 1.0f,
        /// <summary>Energy/style modifier for providers that support it (e.g. ElevenLabs style). Default 1.0 = no change.</summary>
        [property: JsonPropertyName("ttsEnergyModifier")] float  TtsEnergyModifier = 1.0f);


    private readonly IConnectionMultiplexer _redis;
    private readonly ITtsSynthesisService _tts;
    private readonly IRhubarbService _rhubarb;
    private readonly LlmResponseStreamSettings _inSettings;
    private readonly TtsOutputStreamSettings _outSettings;
    private readonly ILogger<LlmResponseStreamConsumer> _logger;
    private readonly string _consumerName;


    public LlmResponseStreamConsumer(
        IConnectionMultiplexer redis,
        ITtsSynthesisService tts,
        IRhubarbService rhubarb,
        IOptions<LlmResponseStreamSettings> inSettings,
        IOptions<TtsOutputStreamSettings> outSettings,
        ILogger<LlmResponseStreamConsumer> logger)
    {
        _redis       = redis    ?? throw new ArgumentNullException(nameof(redis));
        _tts         = tts     ?? throw new ArgumentNullException(nameof(tts));
        _rhubarb     = rhubarb ?? throw new ArgumentNullException(nameof(rhubarb));
        _inSettings  = inSettings?.Value  ?? throw new ArgumentNullException(nameof(inSettings));
        _outSettings = outSettings?.Value ?? throw new ArgumentNullException(nameof(outSettings));
        _logger      = logger ?? throw new ArgumentNullException(nameof(logger));

        _consumerName = $"{_inSettings.ConsumerNamePrefix}-{ResolveInstanceId()}";
    }


    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            var db = _redis.GetDatabase();
            await EnsureConsumerGroupAsync(db, stoppingToken);

            _logger.LogInformation(
                "LlmResponseStreamConsumer started. Stream={Stream} Group={Group} Consumer={Consumer}",
                _inSettings.StreamName, _inSettings.ConsumerGroup, _consumerName);

            await Task.WhenAll(
                ConsumeLoopAsync(db, stoppingToken),
                AutoClaimLoopAsync(db, stoppingToken));
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // normal shutdown
        }

        _logger.LogInformation("LlmResponseStreamConsumer stopped.");
    }


    private async Task EnsureConsumerGroupAsync(IDatabase db, CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                await db.StreamCreateConsumerGroupAsync(
                    _inSettings.StreamName,
                    _inSettings.ConsumerGroup,
                    StreamPosition.Beginning,
                    createStream: true);
                return;
            }
            catch (RedisException ex) when (ex.Message.Contains("BUSYGROUP", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogDebug("Consumer group already exists: {Group}", _inSettings.ConsumerGroup);
                return;
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to create consumer group, retrying in 2s...");
                await Task.Delay(TimeSpan.FromSeconds(2), ct);
            }
        }
    }


    private async Task ConsumeLoopAsync(IDatabase db, CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                var entries = await db.StreamReadGroupAsync(
                    _inSettings.StreamName,
                    _inSettings.ConsumerGroup,
                    _consumerName,
                    position: null,
                    count: _inSettings.ReadCount,
                    noAck: false);

                if (entries.Length == 0)
                {
                    await Task.Delay(_inSettings.ReadBlockMilliseconds, ct);
                    continue;
                }

                foreach (var entry in entries)
                    await ProcessEntryAsync(db, entry, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Stream read error, retrying in 2s...");
                await Task.Delay(TimeSpan.FromSeconds(2), ct);
            }
        }
    }

    private async Task AutoClaimLoopAsync(IDatabase db, CancellationToken ct)
    {
        var cursor = (RedisValue)"0-0";

        while (!ct.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromSeconds(_inSettings.AutoClaimLoopDelaySeconds), ct);

            try
            {
                var result = await db.StreamAutoClaimAsync(
                    _inSettings.StreamName,
                    _inSettings.ConsumerGroup,
                    _consumerName,
                    minIdleTimeInMs: _inSettings.AutoClaimMinIdleMs,
                    startAtId: cursor,
                    count: _inSettings.AutoClaimBatchSize);

                if (result.IsNull) { cursor = "0-0"; continue; }

                cursor = result.NextStartId.IsNullOrEmpty || result.NextStartId == "0-0"
                    ? "0-0"
                    : result.NextStartId;

                foreach (var entry in result.ClaimedEntries)
                    await ProcessEntryAsync(db, entry, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "XAUTOCLAIM iteration failed");
                cursor = "0-0";
            }
        }
    }


    private async Task ProcessEntryAsync(IDatabase db, StreamEntry entry, CancellationToken ct)
    {
        var payloadJson = ReadField(entry, _inSettings.PayloadFieldName);

        if (payloadJson is null)
        {
            _logger.LogWarning("Entry {Id} has no payload field — discarding", entry.Id);
            await AckAsync(db, entry.Id);
            return;
        }

        LlmResponse? response;
        try
        {
            response = JsonSerializer.Deserialize<LlmResponse>(payloadJson);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Malformed LLM response payload. Id={Id} — discarding", entry.Id);
            await AckAsync(db, entry.Id);
            return;
        }

        if (response is null || string.IsNullOrWhiteSpace(response.Text))
        {
            _logger.LogWarning("LLM response {Id} has empty text — discarding", entry.Id);
            await AckAsync(db, entry.Id);
            return;
        }

        try
        {
            await SynthesizeAndPublishAsync(db, response, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Unhandled error during TTS synthesis. Correlation={Correlation}",
                response.CorrelationId);
        }
        finally
        {
            // Always ACK: stale audio is worthless and retrying a transient TTS error
            // would only delay the pipeline. Errors are surfaced via structured logs / metrics.
            await AckAsync(db, entry.Id);
        }
    }

    private async Task SynthesizeAndPublishAsync(IDatabase db, LlmResponse response, CancellationToken ct)
    {
        // Voice and provider are resolved upstream by the Python llm-worker from ContextShardPayload.
        // Fall back to the configured default voice only when the worker sends no voice info
        // (e.g. old worker version or TTS disabled on the AiCard).
        var voiceId = string.IsNullOrWhiteSpace(response.VoiceId)
            ? _inSettings.DefaultVoiceId
            : response.VoiceId;

        // Apply emotion-driven speed modifier on top of the base TTS speed.
        var effectiveSpeed = response.TtsSpeed is not null
            ? response.TtsSpeed * response.TtsSpeedModifier
            : (float?)null;

        var command = new SynthesizeCommand(
            ProviderId:  response.TtsProviderId,   // null → uses TtsProviders:DefaultProviderId
            Text:        response.Text,
            VoiceId:     voiceId,
            ModelId:     response.TtsModelId,
            Speed:       effectiveSpeed,
            Stream:      false,
            AudioFormat: "wav");

        var result = await _tts.SynthesizeAsync(command, ct);

        switch (result)
        {
            case SpeechResult.Ok ok:
                await PublishAudioAsync(db, response, ok, ct);
                break;

            case SpeechResult.UpstreamError err:
                _logger.LogWarning(
                    "TTS upstream error. Correlation={Correlation} Detail={Detail}",
                    response.CorrelationId, err.Message);
                break;

            default:
                _logger.LogWarning(
                    "TTS synthesis failed. Correlation={Correlation} Result={Result}",
                    response.CorrelationId, result.GetType().Name);
                break;
        }
    }

    private async Task PublishAudioAsync(
        IDatabase db,
        LlmResponse response,
        SpeechResult.Ok ok,
        CancellationToken ct)
    {
        // Pre-size avoids repeated doubling for typical TTS clip sizes (~256 KB–1 MB).
        using var ms = new MemoryStream(capacity: 512 * 1024);
        await ok.Audio.CopyToAsync(ms, ct);
        var wavBytes    = ms.ToArray();
        var audioBase64 = Convert.ToBase64String(wavBytes);

        // Run Rhubarb in parallel with Redis publish prep. Null when unavailable — the
        // frontend falls back to real-time formant analysis transparently.
        var visemeTimeline = await _rhubarb.AnalyzeAsync(wavBytes, ct);

        // Downstream shape — Realtime/Publisher Worker deserializes this from synapse.tts.ready.
        // sequenceNumber and isLast allow the consumer to reorder chunks and detect completion.
        var payload = JsonSerializer.Serialize(new
        {
            correlationId  = response.CorrelationId,
            channelId      = response.ChannelId,
            platformId     = response.PlatformId,
            sequenceNumber = response.SequenceNumber,
            isLast         = response.IsLast,
            audioBase64,
            contentType    = ok.ContentType,
            llmModel         = response.Model,
            visemeTimeline,   // VisemeCue[]? — null → frontend uses formant fallback
            emotionId        = response.EmotionId,
            emotionIntensity = response.EmotionIntensity,
        });

        await db.StreamAddAsync(
            _outSettings.StreamName,
            [new NameValueEntry(_outSettings.PayloadFieldName, payload)],
            maxLength: (int)_outSettings.ApproximateMaxLength,
            useApproximateMaxLength: true);

        _logger.LogInformation(
            "TTS audio published. Channel={Channel} Correlation={Correlation} Seq={Seq} IsLast={IsLast} Bytes={Bytes}",
            response.ChannelId, response.CorrelationId, response.SequenceNumber, response.IsLast, ms.Length);
    }


    private Task AckAsync(IDatabase db, RedisValue entryId)
        => db.StreamAcknowledgeAsync(_inSettings.StreamName, _inSettings.ConsumerGroup, entryId);

    private static string? ReadField(StreamEntry entry, string field)
    {
        foreach (var v in entry.Values)
            if (v.Name.ToString() == field) return v.Value.ToString();
        return null;
    }

    /// <summary>
    /// Resolves a stable instance identifier for the consumer name (hostname, pod name, or short GUID).
    /// Keeps consumer names meaningful in Redis XPENDING output.
    /// </summary>
    private static string ResolveInstanceId()
        => Environment.GetEnvironmentVariable("DOTNET_HOSTNAME")
           ?? Environment.GetEnvironmentVariable("HOSTNAME")
           ?? Environment.GetEnvironmentVariable("K8S_POD_NAME")
           ?? IdGenerator.New().ToString("N")[..8];

}
