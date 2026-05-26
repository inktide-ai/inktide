using Inktide.API.Marketplace.Domain.Entities;

namespace Inktide.API.Marketplace.Domain.Repositories;

public interface IConnectorRepository
{
    Task<IReadOnlyList<Connector>> GetAllAsync(CancellationToken ct);
    Task<Connector?> GetBySlugAsync(string slug, CancellationToken ct);
}
