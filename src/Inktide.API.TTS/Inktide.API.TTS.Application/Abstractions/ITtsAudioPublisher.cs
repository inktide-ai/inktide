namespace Inktide.API.TTS.Application.Abstractions;

public interface ITtsAudioPublisher
{
    Task PublishAsync(TtsAudioPayload payload, CancellationToken ct = default);
}

public sealed record TtsAudioPayload(
    string  CorrelationId,
    string  ChannelId,
    string  PlatformId,
    int     SequenceNumber,
    bool    IsLast,
    byte[]  WavBytes,
    string  ContentType,
    string  LlmModel,
    string? EmotionId,
    float   EmotionIntensity,
    // SoulState pass-through - forwarded to synapse.tts.ready and then to SignalR
    float   VadV      = 0f,
    float   VadA      = 0f,
    float   VadD      = 0f,
    float   Energy    = 1f,
    float   Attention = 0f,
    float   Comfort   = 0.5f);
