using Inktide.API.Core.Generators;

namespace Inktide.API.Marketplace.Domain.Entities;

public sealed class ConnectorInstallation
{
    private ConnectorInstallation() { }

    public Guid             Id          { get; private set; }
    public Guid             SoulId      { get; private set; }
    public Guid             ConnectorId { get; private set; }
    public DateTimeOffset   InstalledAt { get; private set; }

    public Connector? Connector { get; private set; }

    public static ConnectorInstallation Create(
        Guid soulId,
        Guid connectorId,
        TimeProvider? time = null,
        Guid? id = null) => new()
    {
        Id          = id ?? IdGenerator.New(),
        SoulId      = soulId,
        ConnectorId = connectorId,
        InstalledAt = (time ?? TimeProvider.System).GetUtcNow(),
    };
}
