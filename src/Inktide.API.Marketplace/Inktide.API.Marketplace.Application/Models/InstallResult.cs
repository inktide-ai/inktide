using Inktide.API.Marketplace.Domain.Entities;

namespace Inktide.API.Marketplace.Application.Models;

public sealed record InstallResult(ConnectorInstallation Installation, bool IsNew)
{
    public static InstallResult New(ConnectorInstallation i)      => new(i, IsNew: true);
    public static InstallResult Existing(ConnectorInstallation i) => new(i, IsNew: false);
}
