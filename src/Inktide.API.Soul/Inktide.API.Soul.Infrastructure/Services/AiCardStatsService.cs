using System.Data;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Repositories;
using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Soul.Infrastructure.Services;

public sealed class AiCardStatsService : IAiCardStatsService
{
    private readonly IAiCardService          _cardService;
    private readonly IUsageDailyRepository   _usage;
    private readonly SoulDbContext           _db;

    public AiCardStatsService(
        IAiCardService        cardService,
        IUsageDailyRepository usage,
        SoulDbContext         db)
    {
        _cardService = cardService ?? throw new ArgumentNullException(nameof(cardService));
        _usage       = usage       ?? throw new ArgumentNullException(nameof(usage));
        _db          = db          ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<AiCardStats?> GetStatsAsync(Guid userId, Guid cardId, CancellationToken ct = default)
    {
        var card = await _cardService.GetByIdAsync(userId, cardId, ct).ConfigureAwait(false);
        if (card is null) return null;

        var today = await _usage.GetTodayAsync(cardId, ct).ConfigureAwait(false);

        var memoryCount = await CountMemoryAsync(cardId, ct).ConfigureAwait(false);

        return new AiCardStats(
            Messages24h:  today?.MessagesReceived ?? 0,
            LlmCalls24h:  today?.LlmCalls         ?? 0,
            TtsChars24h:  today?.TtsCharacters     ?? 0,
            MemoryCount:  memoryCount
        );
    }

    private async Task<int> CountMemoryAsync(Guid cardId, CancellationToken ct)
    {
        var conn = _db.Database.GetDbConnection();
        var wasOpen = conn.State == ConnectionState.Open;
        if (!wasOpen)
            await conn.OpenAsync(ct).ConfigureAwait(false);
        try
        {
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT COUNT(*) FROM soul.memory_metadata WHERE ai_card_id = @id";
            var p = cmd.CreateParameter();
            p.ParameterName = "id";
            p.Value = cardId;
            cmd.Parameters.Add(p);
            var result = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
            return result is null or DBNull ? 0 : Convert.ToInt32(result);
        }
        finally
        {
            if (!wasOpen)
                await conn.CloseAsync().ConfigureAwait(false);
        }
    }
}
