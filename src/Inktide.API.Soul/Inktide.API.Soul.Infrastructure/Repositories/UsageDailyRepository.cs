using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Repositories;
using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Soul.Infrastructure.Repositories;

public sealed class UsageDailyRepository : IUsageDailyRepository
{
    private readonly SoulDbContext _db;
    private readonly TimeProvider  _time;

    public UsageDailyRepository(SoulDbContext db, TimeProvider time)
    {
        _db   = db   ?? throw new ArgumentNullException(nameof(db));
        _time = time ?? throw new ArgumentNullException(nameof(time));
    }


    public async Task<UsageDaily?> GetTodayAsync(Guid aiCardId, CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(_time.GetUtcNow().UtcDateTime);
        return await _db.UsageDaily
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.AiCardId == aiCardId && u.UsageDate == today, ct);
    }

    public async Task IncrementAsync(Guid aiCardId, int llmCalls = 0, int tokensPrompt = 0, int tokensCompletion = 0,
        int messagesReceived = 0, int messagesSent = 0, int ttsCharacters = 0, int donkeyThoughts = 0,
        int visionFramesProcessed = 0, int visionEventsDetected = 0,
        CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(_time.GetUtcNow().UtcDateTime);

        await _db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO soul.usage_daily (id, ai_card_id, usage_date, llm_calls, tokens_prompt, tokens_completion,
                                          messages_received, messages_sent, tts_characters, donkey_thoughts,
                                          vision_frames_processed, vision_events_detected)
            VALUES (gen_random_uuid(), {aiCardId}, {today}, {llmCalls}, {tokensPrompt}, {tokensCompletion},
                    {messagesReceived}, {messagesSent}, {ttsCharacters}, {donkeyThoughts},
                    {visionFramesProcessed}, {visionEventsDetected})
            ON CONFLICT (ai_card_id, usage_date) DO UPDATE SET
                llm_calls = soul.usage_daily.llm_calls + EXCLUDED.llm_calls,
                tokens_prompt = soul.usage_daily.tokens_prompt + EXCLUDED.tokens_prompt,
                tokens_completion = soul.usage_daily.tokens_completion + EXCLUDED.tokens_completion,
                messages_received = soul.usage_daily.messages_received + EXCLUDED.messages_received,
                messages_sent = soul.usage_daily.messages_sent + EXCLUDED.messages_sent,
                tts_characters = soul.usage_daily.tts_characters + EXCLUDED.tts_characters,
                donkey_thoughts = soul.usage_daily.donkey_thoughts + EXCLUDED.donkey_thoughts,
                vision_frames_processed = soul.usage_daily.vision_frames_processed + EXCLUDED.vision_frames_processed,
                vision_events_detected = soul.usage_daily.vision_events_detected + EXCLUDED.vision_events_detected
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

    public async Task<int> SumLlmCallsSinceAsync(DateOnly from, CancellationToken ct = default)
    {
        return await _db.UsageDaily
            .AsNoTracking()
            .Where(u => u.UsageDate >= from)
            .SumAsync(u => u.LlmCalls, ct);
    }

}
