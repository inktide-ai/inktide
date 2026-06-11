using Inktide.API.Profile.Application.Messages;
using Inktide.API.Profile.Infrastructure.Keycloak;
using Inktide.API.Profile.Infrastructure.Settings;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Profile.Infrastructure.Messaging;

public sealed class KeycloakUserDeletionConsumer(
    IKeycloakAdminClient keycloak,
    KeycloakAdminSettings adminSettings,
    ILogger<KeycloakUserDeletionConsumer> logger) : IConsumer<KeycloakDeleteUserRequested>
{
    public async Task Consume(ConsumeContext<KeycloakDeleteUserRequested> context)
    {
        var userId = context.Message.UserId;
        var ct     = context.CancellationToken;

        if (!adminSettings.Enabled)
        {
            logger.LogInformation("Keycloak admin disabled — skipping deletion for {UserId}", userId);
            return;
        }

        var (ok, err) = await keycloak.TryDeleteUserAsync(userId, ct).ConfigureAwait(false);
        if (ok)
        {
            logger.LogInformation("Keycloak user {UserId} deleted successfully", userId);
            return;
        }

        // Non-null error = retriable failure — throw so MassTransit retries
        throw new KeycloakOperationException(
            $"Failed to delete Keycloak user {userId}: {err}");
    }
}

public sealed class KeycloakOperationException(string message) : Exception(message);
