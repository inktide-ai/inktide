using Inktide.API.Marketplace.Domain.Entities;

namespace Inktide.API.Marketplace.REST.Models;

public sealed record InstallationDto(
    Guid           Id,
    Guid           SoulId,
    Guid           ConnectorId,
    string         ConnectorSlug,
    string         ConnectorName,
    DateTimeOffset InstalledAt)
{
    public static InstallationDto From(ConnectorInstallation i) => new(
        i.Id,
        i.SoulId,
        i.ConnectorId,
        i.Connector?.Slug  ?? string.Empty,
        i.Connector?.Name  ?? string.Empty,
        i.InstalledAt);
}
