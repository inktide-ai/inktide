using System.Text.Json;
using Microsoft.Extensions.Logging;
using Polly;
using StackExchange.Redis;
using Chimera.Identity.Application.Interfaces.Auth;
using Chimera.Identity.Application.Models.Auth;

namespace Chimera.Identity.Infrastructure.Auth;

/// <summary>
/// Redis-backed refresh token store with token-family reuse detection.
/// </summary>
/// <remarks>
/// <b>Redis key layout:</b>
/// <list type="bullet">
///   <item><c>rt:active:{token}</c>  — live token JSON (TTL = lifetime). Deleted on consume or logout.</item>
///   <item><c>rt:consumed:{token}</c> — familyId of a consumed-via-rotation token (same TTL).
///     Presence of this key without an active key means reuse.</item>
///   <item><c>rt:family:{familyId}:revoked</c> — marker set when reuse is detected. Checked on every consume.
///     Any valid-looking token whose family is flagged is rejected immediately.</item>
/// </list>
/// </remarks>
public sealed class RefreshTokenStore : IRefreshTokenStore
{
    #region Constants

    private const string ActivePrefix = "rt:active:";
    private const string ConsumedPrefix = "rt:consumed:";
    private const string FamilyRevokedSuffix = ":revoked";
    private const string FamilyPrefix = "rt:family:";

    #endregion

    #region Fields

    // Stored as compact camelCase JSON.
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    // Atomically reads the active token and checks the consumed marker in a single round-trip.
    // Returns a 3-element array: [status, json_or_empty, familyId_or_empty]
    //   status 0 = not found (expired or never existed)
    //   status 1 = found; json is in element [1]
    //   status 2 = reuse detected; familyId is in element [2]
    private static readonly LuaScript ConsumeScript = LuaScript.Prepare(@"
        local v = redis.call('GET', @activeKey)
        if v then
            redis.call('DEL', @activeKey)
            return {1, v, ''}
        end
        local c = redis.call('GET', @consumedKey)
        if c then
            return {2, '', tostring(c)}
        end
        return {0, '', ''}
    ");

    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RefreshTokenStore> _logger;
    private readonly AsyncPolicy _retryPolicy;

    #endregion

    #region Constructors

    public RefreshTokenStore(IConnectionMultiplexer redis, ILogger<RefreshTokenStore> logger)
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

    /// <inheritdoc/>
    public async Task StoreAsync(
        string refreshToken,
        string userId,
        string role,
        string familyId,
        TimeSpan lifetime,
        CancellationToken ct = default)
    {
        var db = _redis.GetDatabase();
        var key = ActiveKey(refreshToken);
        var value = JsonSerializer.Serialize(new StoredPayload(userId, role, familyId), JsonOptions);

        await _retryPolicy.ExecuteAsync(() => db.StringSetAsync(key, value, lifetime));
    }

    /// <inheritdoc/>
    public async Task<RefreshTokenPayload?> ConsumeAsync(
        string refreshToken,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return null;
        }

        var db = _redis.GetDatabase();
        var activeKey = (RedisKey)ActiveKey(refreshToken);
        var consumedKey = (RedisKey)ConsumedKey(refreshToken);

        var result = await _retryPolicy.ExecuteAsync(() =>
            db.ScriptEvaluateAsync(ConsumeScript, new { activeKey, consumedKey }));

        var arr = (RedisValue[])result!;
        var status = (int)arr[0];

        if (status == 2)
        {
            // Reuse detected — revoke the entire family.
            var familyId = arr[2].ToString();
            _logger.LogWarning(
                "Refresh token reuse detected! FamilyId={FamilyId}. Revoking entire session family.",
                familyId);

            await RevokeFamilyAsync(db, familyId);
            return null;
        }

        if (status != 1)
        {
            return null;
        }

        var stored = JsonSerializer.Deserialize<StoredPayload>(arr[1].ToString(), JsonOptions);
        if (stored is null)
        {
            return null;
        }

        // Check if the family was already revoked (e.g. by a previous reuse detection).
        var isRevoked = await _retryPolicy.ExecuteAsync(() =>
            db.KeyExistsAsync(FamilyRevokedKey(stored.FamilyId)));

        if (isRevoked)
        {
            _logger.LogWarning(
                "Token belongs to a revoked family. FamilyId={FamilyId} UserId={UserId}",
                stored.FamilyId, stored.UserId);
            return null;
        }

        // Store consumed marker so replay of this token triggers reuse detection.
        // TTL matches the original token lifetime (7 days default) so the window is meaningful.
        var consumedTtl = TimeSpan.FromDays(7);
        await _retryPolicy.ExecuteAsync(() =>
            db.StringSetAsync(ConsumedKey(refreshToken), stored.FamilyId, consumedTtl));

        return new RefreshTokenPayload(stored.UserId, stored.Role, stored.FamilyId);
    }

    /// <inheritdoc/>
    public async Task DeleteAsync(string refreshToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return;
        }

        var db = _redis.GetDatabase();
        await _retryPolicy.ExecuteAsync(() => db.KeyDeleteAsync(ActiveKey(refreshToken)));
    }

    #endregion

    #region Private Methods

    private Task RevokeFamilyAsync(IDatabase db, string familyId) =>
        _retryPolicy.ExecuteAsync(() =>
            db.StringSetAsync(FamilyRevokedKey(familyId), "1", TimeSpan.FromDays(7)));

    private static string ActiveKey(string token) => string.Concat(ActivePrefix, token);
    private static string ConsumedKey(string token) => string.Concat(ConsumedPrefix, token);
    private static string FamilyRevokedKey(string familyId) =>
        string.Concat(FamilyPrefix, familyId, FamilyRevokedSuffix);

    #endregion

    // Compact storage model.
    private record StoredPayload(string UserId, string Role, string FamilyId);
}
