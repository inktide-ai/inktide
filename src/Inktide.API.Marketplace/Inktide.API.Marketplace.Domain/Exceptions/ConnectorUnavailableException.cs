namespace Inktide.API.Marketplace.Domain.Exceptions;

public sealed class ConnectorUnavailableException(string slug)
    : MarketplaceDomainException($"Connector '{slug}' is not yet available.");
