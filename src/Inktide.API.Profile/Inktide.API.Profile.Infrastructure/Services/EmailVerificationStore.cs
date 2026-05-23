using Inktide.API.Profile.Application.Interfaces;
using Inktide.API.Profile.Infrastructure.Constants;
using StackExchange.Redis;

namespace Inktide.API.Profile.Infrastructure.Services;

internal sealed class EmailVerificationStore : IEmailVerificationStore
{
    private readonly IConnectionMultiplexer _redis;

    public EmailVerificationStore(IConnectionMultiplexer redis)
    {
        _redis = redis ?? throw new ArgumentNullException(nameof(redis));
    }

    public async Task StoreAsync(string userId, string code, string newEmail, CancellationToken ct = default)
    {
        var db = _redis.GetDatabase();
        await db.StringSetAsync(
            RedisKey(userId),
            $"{code}:{newEmail}",
            TimeSpan.FromMinutes(ProfileConstants.EmailChange.TtlMinutes))
            .ConfigureAwait(false);
    }

    public async Task<string?> VerifyAndConsumeAsync(string userId, string code, CancellationToken ct = default)
    {
        var db     = _redis.GetDatabase();
        var stored = await db.StringGetAsync(RedisKey(userId)).ConfigureAwait(false);
        if (stored.IsNullOrEmpty) return null;

        var parts = stored.ToString().Split(':', 2);
        if (parts.Length != 2 || !string.Equals(parts[0], code.Trim(), StringComparison.OrdinalIgnoreCase))
            return null;

        var newEmail = parts[1];
        await db.KeyDeleteAsync(RedisKey(userId)).ConfigureAwait(false);
        return newEmail;
    }

    private static string RedisKey(string userId) => ProfileConstants.EmailChange.RedisKeyPrefix + userId;
}
