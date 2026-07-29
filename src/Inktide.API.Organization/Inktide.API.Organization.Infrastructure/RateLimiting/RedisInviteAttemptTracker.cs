using System.Security.Cryptography;
using System.Text;
using Inktide.API.Organization.Application.Interfaces;
using Inktide.API.Organization.Infrastructure.Settings;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Organization.Infrastructure.RateLimiting;

public sealed class RedisInviteAttemptTracker : IInviteAttemptTracker
{
    // Token is SHA256-hashed before persistence to avoid storing raw invite secrets in Redis.
    // actorId must be canonical internal user identifier - not external identity claim (sub, email).
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
    private readonly OrganizationSettings _settings;
    private readonly ILogger<RedisInviteAttemptTracker> _logger;

    public RedisInviteAttemptTracker(
        IConnectionMultiplexer redis,
        OrganizationSettings settings,
        ILogger<RedisInviteAttemptTracker> logger)
    {
        _redis    = redis;
        _settings = settings;
        _logger   = logger;
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
                values: [(RedisValue)_settings.InviteAttemptTtlSeconds]).ConfigureAwait(false);

            return count <= _settings.InviteMaxAttempts;
        }
        catch (RedisException ex)
        {
            // Fail-open: attempt tracking is abuse mitigation, not a security boundary.
            _logger.LogWarning(ex, "Redis unavailable — invite attempt tracking skipped for actor {ActorId}", actorId);
            return true;
        }
    }
}
