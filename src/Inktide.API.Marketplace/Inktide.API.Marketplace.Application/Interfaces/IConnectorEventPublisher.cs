namespace Inktide.API.Marketplace.Application.Interfaces;

public interface IConnectorEventPublisher
{
    Task PublishInstalledAsync(Guid installationId, Guid soulId, string connectorSlug, CancellationToken ct);
    Task PublishUninstalledAsync(Guid installationId, Guid soulId, string connectorSlug, CancellationToken ct);
}
