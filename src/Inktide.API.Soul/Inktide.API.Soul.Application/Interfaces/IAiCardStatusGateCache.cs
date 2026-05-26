namespace Inktide.API.Soul.Application.Interfaces;

public interface IAiCardStatusGateCache
{
    Task BlockAsync(Guid cardId, CancellationToken ct = default);
    Task UnblockAsync(Guid cardId, CancellationToken ct = default);
}
