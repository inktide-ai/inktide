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
    float   EmotionIntensity);
