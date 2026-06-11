using Inktide.API.Core.Messaging;
using System.Text.Json;
using System.Text.Json.Serialization;
using Inktide.API.TTS.Application.Abstractions;
using Inktide.API.TTS.Application.Configuration;
using Inktide.API.TTS.Application.Synthesis;
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
public sealed class LlmResponseStreamConsumer : RedisStreamConsumerBase
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
        /// <summary>UserId (Guid) of the card owner — used for per-user TTS credential lookup.</summary>
        [property: JsonPropertyName("userId")]         Guid?   UserId,
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
        /// <summary>Per-soul TTS endpoint override. Null = use globally configured endpoint.</summary>
        [property: JsonPropertyName("ttsBaseUrl")]           string? TtsBaseUrl           = null,
        /// <summary>Pre-serialized JSON of provider-specific params (stability, pitch, etc.). Deserialized here before synthesis.</summary>
        [property: JsonPropertyName("ttsProviderParamsJson")] string? TtsProviderParamsJson = null,
        /// <summary>Speed multiplier from VAD arousal formula. Applied on top of TtsSpeed. Default 1.0 = no change.</summary>
        [property: JsonPropertyName("ttsSpeedModifier")]  float  TtsSpeedModifier  = 1.0f,
        /// <summary>Energy/style modifier from VAD formula. Default 1.0 = no change.</summary>
        [property: JsonPropertyName("ttsEnergyModifier")] float  TtsEnergyModifier = 1.0f,
        // SoulState — VAD vector and PhysicalState for frontend animation
        [property: JsonPropertyName("vadV")]      float VadV      = 0f,
        [property: JsonPropertyName("vadA")]      float VadA      = 0f,
        [property: JsonPropertyName("vadD")]      float VadD      = 0f,
        [property: JsonPropertyName("energy")]    float Energy    = 1f,
        [property: JsonPropertyName("attention")] float Attention = 0f,
        [property: JsonPropertyName("comfort")]   float Comfort   = 0.5f);


    private readonly ITtsSynthesisService _tts;
    private readonly ITtsAudioPublisher _publisher;
    private readonly LlmResponseStreamSettings _inSettings;
    private readonly ILogger<LlmResponseStreamConsumer> _logger;
    private readonly string _consumerName;

    protected override string StreamName              => _inSettings.StreamName;
    protected override string ConsumerGroup           => _inSettings.ConsumerGroup;
    protected override string ConsumerName            => _consumerName;
    protected override string PayloadFieldName        => _inSettings.PayloadFieldName;
    protected override int    ReadCount               => _inSettings.ReadCount;
    protected override int    ReadBlockMilliseconds   => _inSettings.ReadBlockMilliseconds;
    protected override long   AutoClaimMinIdleMs      => _inSettings.AutoClaimMinIdleMs;
    protected override int    AutoClaimBatchSize      => _inSettings.AutoClaimBatchSize;
    protected override int    AutoClaimLoopDelaySeconds => _inSettings.AutoClaimLoopDelaySeconds;

    public LlmResponseStreamConsumer(
        IConnectionMultiplexer redis,
        ITtsSynthesisService tts,
        ITtsAudioPublisher publisher,
        IOptions<LlmResponseStreamSettings> inSettings,
        ILogger<LlmResponseStreamConsumer> logger)
        : base(redis, logger)
    {
        _tts        = tts        ?? throw new ArgumentNullException(nameof(tts));
        _publisher  = publisher  ?? throw new ArgumentNullException(nameof(publisher));
        _inSettings = inSettings?.Value ?? throw new ArgumentNullException(nameof(inSettings));
        _logger     = logger     ?? throw new ArgumentNullException(nameof(logger));

        _consumerName = $"{_inSettings.ConsumerNamePrefix}-{ResolveInstanceId()}";
    }


    protected override async Task ProcessEntryAsync(IDatabase db, StreamEntry entry, CancellationToken ct)
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
            await SynthesizeAndPublishAsync(response, ct);
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

    private async Task SynthesizeAndPublishAsync(LlmResponse response, CancellationToken ct)
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

        // Deserialize provider params here — the only place in the pipeline that needs them.
        IReadOnlyDictionary<string, object>? providerParams = null;
        if (response.TtsProviderParamsJson is not null)
        {
            try
            {
                providerParams = JsonSerializer.Deserialize<Dictionary<string, object>>(response.TtsProviderParamsJson);
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex,
                    "Failed to deserialize ttsProviderParamsJson. Correlation={Correlation} — using provider defaults",
                    response.CorrelationId);
            }
        }

        var command = new SynthesizeCommand(
            ProviderId:    response.TtsProviderId,
            Text:          response.Text,
            VoiceId:       voiceId,
            ModelId:       response.TtsModelId,
            Speed:         effectiveSpeed,
            Stream:        false,
            AudioFormat:   "wav",
            UserId:        response.UserId?.ToString(),
            ProviderParams: providerParams,
            BaseUrl:        response.TtsBaseUrl);

        var result = await _tts.SynthesizeAsync(command, ct);

        switch (result)
        {
            case SpeechResult.Ok ok:
                using (var ms = new MemoryStream(capacity: 512 * 1024))
                {
                    await ok.Audio.CopyToAsync(ms, ct);
                    await _publisher.PublishAsync(new TtsAudioPayload(
                        CorrelationId:   response.CorrelationId,
                        ChannelId:       response.ChannelId,
                        PlatformId:      response.PlatformId,
                        SequenceNumber:  response.SequenceNumber,
                        IsLast:          response.IsLast,
                        WavBytes:        ms.ToArray(),
                        ContentType:     ok.ContentType,
                        LlmModel:        response.Model,
                        EmotionId:       response.EmotionId,
                        EmotionIntensity: response.EmotionIntensity,
                        VadV:      response.VadV,
                        VadA:      response.VadA,
                        VadD:      response.VadD,
                        Energy:    response.Energy,
                        Attention: response.Attention,
                        Comfort:   response.Comfort), ct);
                }
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
}
