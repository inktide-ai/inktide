using System.Security.Cryptography;
using System.Text;
using Inktide.API.Organization.Application.Interfaces;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Organization.Infrastructure.RateLimiting;

public sealed class RedisInviteAttemptTracker : IInviteAttemptTracker
{
    private const int MaxAttempts = 10;
    private const int TtlSeconds = 3600; // 1h — sufficient for anti-abuse, does not lock out permanently

    // Token is SHA256-hashed before persistence to avoid storing raw invite secrets in Redis.
    // actorId must be canonical internal user identifier — not external identity claim (sub, email).
    // Using external claims risks split counters across identity provider migrations.
    private static readonly string LuaScript =
        """
        local current = redis.call("INCR", KEYS[1])
        if current == 1 then
          redis.call("EXPIRE", KEYS[1], ARGV[1])
        end
        return current
        """;

    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RedisInviteAttemptTracker> _logger;

    public RedisInviteAttemptTracker(IConnectionMultiplexer redis, ILogger<RedisInviteAttemptTracker> logger)
    {
        _redis = redis;
        _logger = logger;
    }

    public async Task<bool> TryRecordAttemptAsync(string token, string actorId, CancellationToken ct = default)
    {
        try
        {
            var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
            var key = $"org:invite:attempts:{actorId}:{tokenHash}";
            var db = _redis.GetDatabase();

            var count = (long)await db.ScriptEvaluateAsync(
                LuaScript,
                keys: [key],
                values: [(RedisValue)TtlSeconds]).ConfigureAwait(false);

            return count <= MaxAttempts;
        }
        catch (RedisException ex)
        {
            // Fail-open: attempt tracking is abuse mitigation, not a security boundary.
            _logger.LogWarning(ex, "Redis unavailable — invite attempt tracking skipped for actor {ActorId}", actorId);
            return true;
        }
    }
}
