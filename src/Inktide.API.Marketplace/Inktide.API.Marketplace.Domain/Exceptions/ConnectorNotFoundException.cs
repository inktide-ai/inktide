namespace Inktide.API.Marketplace.Domain.Exceptions;

public sealed class ConnectorNotFoundException(string slugOrId)
    : MarketplaceDomainException($"Connector '{slugOrId}' not found.");
