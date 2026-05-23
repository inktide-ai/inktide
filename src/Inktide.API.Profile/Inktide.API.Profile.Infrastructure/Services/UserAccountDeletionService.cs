using System.Text.Json;
using Inktide.API.Core.Constants;
using Inktide.API.Core.Events;
using Inktide.API.Core.Transactions;
using Inktide.API.Profile.Application.Interfaces;
using Inktide.API.Profile.Infrastructure.Keycloak;
using Inktide.API.Profile.Infrastructure.Settings;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Profile.Infrastructure.Services;

public sealed class UserAccountDeletionService : IUserAccountDeletionService
{
    private readonly IIntegrationEventPublisher _publisher;
    private readonly IUserProfileRepository _userProfileRepository;
    private readonly IKeycloakAdminClient _keycloakAdmin;
    private readonly KeycloakAdminSettings _adminSettings;
    private readonly ILogger<UserAccountDeletionService> _logger;

    public UserAccountDeletionService(
        IIntegrationEventPublisher publisher,
        IUserProfileRepository userProfileRepository,
        IKeycloakAdminClient keycloakAdmin,
        KeycloakAdminSettings adminSettings,
        ILogger<UserAccountDeletionService> logger)
    {
        _publisher             = publisher             ?? throw new ArgumentNullException(nameof(publisher));
        _userProfileRepository = userProfileRepository ?? throw new ArgumentNullException(nameof(userProfileRepository));
        _keycloakAdmin         = keycloakAdmin         ?? throw new ArgumentNullException(nameof(keycloakAdmin));
        _adminSettings         = adminSettings         ?? throw new ArgumentNullException(nameof(adminSettings));
        _logger                = logger                ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<UserAccountDeletionResult> DeleteAllDataForUserAsync(Guid userId, CancellationToken ct = default)
    {
        // Delete profile data synchronously — this context is the initiator and owns this data.
        // All other contexts (Soul, Billing, Organization) clean up asynchronously via consumers.
        await _userProfileRepository.DeleteAsync(userId.ToString(), ct).ConfigureAwait(false);

        var evt     = new UserAccountDeletedEvent(userId);
        var payload = JsonSerializer.Serialize(evt);
        await _publisher.PublishAsync(StreamNames.EventTypeUserAccountDeleted, payload, ct).ConfigureAwait(false);

        _logger.LogInformation("UserAccountDeleted event published for user {UserId}", userId);

        if (!_adminSettings.Enabled)
        {
            return new UserAccountDeletionResult(
                DatabasePurged: false,
                IdentityRemovedFromKeycloak: false,
                KeycloakAdminSkipped: true,
                Warning: null);
        }

        var (kcOk, kcErr) = await _keycloakAdmin.TryDeleteUserAsync(userId, ct).ConfigureAwait(false);
        if (kcOk)
        {
            return new UserAccountDeletionResult(
                DatabasePurged: false,
                IdentityRemovedFromKeycloak: true,
                KeycloakAdminSkipped: false,
                Warning: null);
        }

        return new UserAccountDeletionResult(
            DatabasePurged: false,
            IdentityRemovedFromKeycloak: false,
            KeycloakAdminSkipped: false,
            Warning: kcErr ?? "Keycloak user deletion failed.");
    }
}
