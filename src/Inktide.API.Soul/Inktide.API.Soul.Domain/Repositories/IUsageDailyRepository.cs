using Inktide.API.Soul.Domain.Entities;

namespace Inktide.API.Soul.Domain.Repositories;

public interface IUsageDailyRepository
{
    Task<UsageDaily?> GetTodayAsync(Guid aiCardId, CancellationToken ct = default);
    Task IncrementAsync(Guid aiCardId, int llmCalls = 0, int tokensPrompt = 0, int tokensCompletion = 0,
        int messagesReceived = 0, int messagesSent = 0, int ttsCharacters = 0, int donkeyThoughts = 0,
        CancellationToken ct = default);
    Task<IReadOnlyList<UsageDaily>> GetRangeAsync(Guid aiCardId, DateOnly from, DateOnly to, CancellationToken ct = default);
}
