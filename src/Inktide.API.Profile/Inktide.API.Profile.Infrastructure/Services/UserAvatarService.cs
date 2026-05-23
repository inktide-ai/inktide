using Inktide.API.Profile.Application.Interfaces;
using Inktide.API.Profile.Infrastructure.Constants;
using Inktide.API.Profile.Infrastructure.Settings;
using Inktide.API.Profile.Infrastructure.Storage;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Profile.Infrastructure.Services;

public sealed class UserAvatarService : IUserAvatarService
{
    private static readonly TimeSpan CacheTtl = ProfileConstants.Cache.AvatarTtl;
    private static string CacheKey(string userId) => ProfileConstants.Cache.AvatarKeyPrefix + userId;

    private readonly S3Settings _s3Settings;
    private readonly IUserProfileRepository _profiles;
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<UserAvatarService> _logger;

    public UserAvatarService(
        S3Settings s3Settings,
        IUserProfileRepository profiles,
        IConnectionMultiplexer redis,
        ILogger<UserAvatarService> logger)
    {
        _s3Settings = s3Settings ?? throw new ArgumentNullException(nameof(s3Settings));
        _profiles = profiles ?? throw new ArgumentNullException(nameof(profiles));
        _redis = redis ?? throw new ArgumentNullException(nameof(redis));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<UserAvatarUpdateResult> SetAvatarFromObjectKeyAsync(
        Guid userId,
        string objectKey,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_s3Settings.DefaultBucket))
            return new UserAvatarUpdateResult(false, null, "S3 default bucket is not configured.");

        var prefixDashed = $"users/{userId}/";
        var prefixNoDash = $"users/{userId:N}/";
        if (!objectKey.StartsWith(prefixDashed, StringComparison.OrdinalIgnoreCase) &&
            !objectKey.StartsWith(prefixNoDash, StringComparison.OrdinalIgnoreCase))
            return new UserAvatarUpdateResult(false, null, "Object key does not belong to the current user.");

        var publicUrl = S3ObjectPublicUrl.Build(_s3Settings, objectKey);
        var userIdStr = userId.ToString();

        await _profiles.UpsertAvatarUrlAsync(userIdStr, publicUrl, ct).ConfigureAwait(false);

        try
        {
            await _redis.GetDatabase()
                .KeyDeleteAsync(CacheKey(userIdStr))
                .ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to invalidate avatar cache for {UserId}", userIdStr);
        }

        _logger.LogInformation("User {UserId} avatar set to {Url}", userId, publicUrl);
        return new UserAvatarUpdateResult(true, publicUrl, null);
    }

    public async Task<string?> GetAvatarUrlAsync(string userId, CancellationToken ct = default)
    {
        try
        {
            var cached = await _redis.GetDatabase()
                .StringGetAsync(CacheKey(userId))
                .ConfigureAwait(false);
            if (!cached.IsNullOrEmpty)
                return cached.ToString();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis read failed for {UserId}", userId);
        }

        var url = await _profiles.GetAvatarUrlAsync(userId, ct).ConfigureAwait(false);

        if (url is not null)
        {
            try
            {
                await _redis.GetDatabase()
                    .StringSetAsync(CacheKey(userId), url, CacheTtl)
                    .ConfigureAwait(false);
            }
            catch { /* cache is best-effort */ }
        }

        return url;
    }
}
