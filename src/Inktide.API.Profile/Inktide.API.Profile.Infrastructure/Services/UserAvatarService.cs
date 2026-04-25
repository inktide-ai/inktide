using Inktide.API.Profile.Application.Interfaces;
using Inktide.API.Profile.Infrastructure.Keycloak;
using Inktide.API.Profile.Infrastructure.Settings;
using Inktide.API.Profile.Infrastructure.Storage;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Profile.Infrastructure.Services;

public sealed class UserAvatarService : IUserAvatarService
{

    private const string PictureAttributeName = "picture";

    private readonly IKeycloakAdminClient _keycloakAdmin;
    private readonly KeycloakAdminSettings _adminSettings;
    private readonly S3Settings _s3Settings;
    private readonly ILogger<UserAvatarService> _logger;


    public UserAvatarService(
        IKeycloakAdminClient keycloakAdmin,
        KeycloakAdminSettings adminSettings,
        S3Settings s3Settings,
        ILogger<UserAvatarService> logger)
    {
        _keycloakAdmin = keycloakAdmin ?? throw new ArgumentNullException(nameof(keycloakAdmin));
        _adminSettings = adminSettings ?? throw new ArgumentNullException(nameof(adminSettings));
        _s3Settings = s3Settings ?? throw new ArgumentNullException(nameof(s3Settings));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }


    public async Task<UserAvatarUpdateResult> SetAvatarFromObjectKeyAsync(
        Guid userId,
        string objectKey,
        CancellationToken ct = default)
    {
        if (!_adminSettings.Enabled)
        {
            return new UserAvatarUpdateResult(
                false,
                null,
                "Keycloak Admin API is disabled. Enable KeycloakAdminSettings and configure a service account with manage-users.");
        }

        if (string.IsNullOrWhiteSpace(_s3Settings.DefaultBucket))
            return new UserAvatarUpdateResult(false, null, "S3 default bucket is not configured.");

        var expectedPrefix = $"users/{userId:N}/";
        if (!objectKey.StartsWith(expectedPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return new UserAvatarUpdateResult(
                false,
                null,
                "Object key does not belong to the current user.");
        }

        var publicUrl = S3ObjectPublicUrl.Build(_s3Settings, objectKey);

        var (ok, err) = await _keycloakAdmin
            .TrySetUserAttributeAsync(userId, PictureAttributeName, [publicUrl], ct)
            .ConfigureAwait(false);

        if (!ok)
        {
            _logger.LogWarning("Failed to set Keycloak picture attribute: {Error}", err);
            return new UserAvatarUpdateResult(false, null, err ?? "Keycloak update failed.");
        }

        _logger.LogInformation("User {UserId} avatar set to {Url}", userId, publicUrl);
        return new UserAvatarUpdateResult(true, publicUrl, null);
    }

}
