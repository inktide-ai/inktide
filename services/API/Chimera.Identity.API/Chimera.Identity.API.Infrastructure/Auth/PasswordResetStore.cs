using System.Security.Cryptography;
using Microsoft.Extensions.Logging;
using Polly;
using StackExchange.Redis;
using Chimera.Identity.Application.Interfaces.Auth;

namespace Chimera.Identity.Infrastructure.Auth;

/// <summary>Redis-backed password reset token store. Each token is a single-use URL-safe random string.</summary>
public sealed class PasswordResetStore : IPasswordResetStore
{
    #region Constants

    private const string KeyPrefix = "pwd-reset:";
    private const int TokenByteLength = 32;

    #endregion

    #region Fields

    // Atomic read-and-delete: returns value then unconditionally removes the key.
    private static readonly LuaScript GetAndDeleteScript = LuaScript.Prepare(
        "local v = redis.call('GET', @key) if v then redis.call('DEL', @key) end return v");

    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<PasswordResetStore> _logger;
    private readonly AsyncPolicy _retryPolicy;

    #endregion

    #region Constructors

    public PasswordResetStore(IConnectionMultiplexer redis, ILogger<PasswordResetStore> logger)
    {
        _redis = redis ?? throw new ArgumentNullException(nameof(redis));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        _retryPolicy = Policy
            .Handle<RedisConnectionException>()
            .WaitAndRetryAsync(
                retryCount: 2,
                sleepDurationProvider: attempt => TimeSpan.FromMilliseconds(attempt * 200),
                onRetry: (ex, delay) =>
                    _logger.LogWarning(ex, "Redis transient failure. Retrying in {DelayMs}ms", delay.TotalMilliseconds));
    }

    #endregion

    #region Public Methods

    public async Task<string> CreateAsync(string userId, TimeSpan lifetime, CancellationToken ct = default)
    {
        var token = GenerateToken();
        var key = BuildKey(token);
        var db = _redis.GetDatabase();

        await _retryPolicy.ExecuteAsync(() => db.StringSetAsync(key, userId, lifetime));

        return token;
    }

    public async Task<string?> ConsumeAsync(string token, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        var db = _redis.GetDatabase();
        var key = (RedisKey)BuildKey(token);

        var result = await _retryPolicy.ExecuteAsync(() =>
            db.ScriptEvaluateAsync(GetAndDeleteScript, new { key }));

        var userId = (RedisValue)result;
        return userId.IsNull ? null : userId.ToString();
    }

    #endregion

    #region Private Methods

    private static string GenerateToken()
    {
        Span<byte> bytes = stackalloc byte[TokenByteLength];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }

    private static string BuildKey(string token) => string.Concat(KeyPrefix, token);

    #endregion
}
