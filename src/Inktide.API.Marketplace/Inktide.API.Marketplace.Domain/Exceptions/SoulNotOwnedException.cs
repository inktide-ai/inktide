namespace Inktide.API.Marketplace.Domain.Exceptions;

public sealed class SoulNotOwnedException(Guid soulId)
    : MarketplaceDomainException($"Soul '{soulId}' not found or not owned.");
