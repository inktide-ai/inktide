using Chimera.API.Soul.Domain.Entities;
using Chimera.API.Soul.Domain.Repositories;
using Chimera.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Chimera.API.Soul.Infrastructure.Repositories;

public sealed class UsageDailyRepository : IUsageDailyRepository
{
    #region Fields

    private readonly SoulDbContext _db;

    #endregion

    #region Constructors

    public UsageDailyRepository(SoulDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    #endregion

    #region Public Methods

    public async Task<UsageDaily?> GetTodayAsync(Guid aiCardId, CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return await _db.UsageDaily
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.AiCardId == aiCardId && u.UsageDate == today, ct);
    }

    public async Task IncrementAsync(Guid aiCardId, int llmCalls = 0, int tokensPrompt = 0, int tokensCompletion = 0,
        int messagesReceived = 0, int messagesSent = 0, int ttsCharacters = 0, int donkeyThoughts = 0,
        CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        await _db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO soul.usage_daily (id, ai_card_id, usage_date, llm_calls, tokens_prompt, tokens_completion,
                                          messages_received, messages_sent, tts_characters, donkey_thoughts)
            VALUES (gen_random_uuid(), {aiCardId}, {today}, {llmCalls}, {tokensPrompt}, {tokensCompletion},
                    {messagesReceived}, {messagesSent}, {ttsCharacters}, {donkeyThoughts})
            ON CONFLICT (ai_card_id, usage_date) DO UPDATE SET
                llm_calls = soul.usage_daily.llm_calls + EXCLUDED.llm_calls,
                tokens_prompt = soul.usage_daily.tokens_prompt + EXCLUDED.tokens_prompt,
                tokens_completion = soul.usage_daily.tokens_completion + EXCLUDED.tokens_completion,
                messages_received = soul.usage_daily.messages_received + EXCLUDED.messages_received,
                messages_sent = soul.usage_daily.messages_sent + EXCLUDED.messages_sent,
                tts_characters = soul.usage_daily.tts_characters + EXCLUDED.tts_characters,
                donkey_thoughts = soul.usage_daily.donkey_thoughts + EXCLUDED.donkey_thoughts
            """, ct);
    }

    public async Task<IReadOnlyList<UsageDaily>> GetRangeAsync(Guid aiCardId, DateOnly from, DateOnly to, CancellationToken ct = default)
    {
        return await _db.UsageDaily
            .AsNoTracking()
            .Where(u => u.AiCardId == aiCardId && u.UsageDate >= from && u.UsageDate <= to)
            .OrderByDescending(u => u.UsageDate)
            .ToListAsync(ct);
    }

    #endregion
}
