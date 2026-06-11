namespace Inktide.API.Soul.Application.Interfaces;

public sealed record AiCardStats(int Messages24h, int LlmCalls24h, int TtsChars24h, int MemoryCount);

public interface IAiCardStatsService
{
    Task<AiCardStats?> GetStatsAsync(Guid userId, Guid cardId, CancellationToken ct = default);
}
