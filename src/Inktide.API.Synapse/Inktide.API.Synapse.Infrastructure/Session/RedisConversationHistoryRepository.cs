using System.Text.Json;
using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Synapse.Infrastructure.Session;

/// <summary>
/// Redis-backed conversation history.
/// Each channel keeps a capped list of JSON-serialised <see cref="ConversationTurn"/> entries.
/// Key format: <c>inktide:session:{channelId}</c>, TTL: 24 h.
/// </summary>
public sealed class RedisConversationHistoryRepository : IConversationHistoryRepository
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    private const int TtlSeconds = 86_400; // 24 h

    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RedisConversationHistoryRepository> _logger;

    public RedisConversationHistoryRepository(
        IConnectionMultiplexer redis,
        ILogger<RedisConversationHistoryRepository> logger)
    {
        _redis  = redis  ?? throw new ArgumentNullException(nameof(redis));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<IReadOnlyList<ConversationTurn>> GetAsync(
        string channelId, int maxTurns, CancellationToken ct = default)
    {
        try
        {
            var db      = _redis.GetDatabase();
            var key     = BuildKey(channelId);
            var entries = await db.ListRangeAsync(key, 0, -1);

            var result = new List<ConversationTurn>(entries.Length);
            foreach (var entry in entries)
            {
                var turn = JsonSerializer.Deserialize<ConversationTurn>(entry.ToString(), JsonOpts);
                if (turn is not null)
                    result.Add(turn);
            }

            // Return at most maxTurns (oldest first)
            return result.Count <= maxTurns
                ? result
                : result.GetRange(result.Count - maxTurns, maxTurns);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Session history read failed for channel {ChannelId}", channelId);
            return [];
        }
    }

    public async Task AppendAsync(
        string channelId, string userMessage, string assistantReply, int maxTurns,
        CancellationToken ct = default)
    {
        try
        {
            var db    = _redis.GetDatabase();
            var key   = BuildKey(channelId);
            var json  = JsonSerializer.Serialize(
                new ConversationTurn(userMessage, assistantReply), JsonOpts);

            var batch = db.CreateBatch();
            var pushTask  = batch.ListRightPushAsync(key, json);
            var trimTask  = batch.ListTrimAsync(key, -maxTurns, -1);
            var expireTask = batch.KeyExpireAsync(key, TimeSpan.FromSeconds(TtlSeconds));
            batch.Execute();

            await Task.WhenAll(pushTask, trimTask, expireTask);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Session history append failed for channel {ChannelId}", channelId);
        }
    }

    private static string BuildKey(string channelId) => $"inktide:session:{channelId}";
}
