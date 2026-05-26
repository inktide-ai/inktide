namespace Inktide.API.Marketplace.Domain.Exceptions;

public sealed class InstallationNotFoundException(Guid installationId)
    : MarketplaceDomainException($"Installation '{installationId}' not found.");
