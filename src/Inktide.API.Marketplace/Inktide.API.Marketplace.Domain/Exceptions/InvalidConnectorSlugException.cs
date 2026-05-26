namespace Inktide.API.Marketplace.Domain.Exceptions;

public sealed class InvalidConnectorSlugException(string slug)
    : MarketplaceDomainException($"Connector slug '{slug}' is invalid or empty.");
