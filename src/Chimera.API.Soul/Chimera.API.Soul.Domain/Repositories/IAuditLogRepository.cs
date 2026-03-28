using System.Net;
using Chimera.API.Soul.Domain.Entities;

namespace Chimera.API.Soul.Domain.Repositories;

public interface IAuditLogRepository
{
    Task LogAsync(Guid userId, string entityType, Guid entityId, string action,
        string? changes = null, IPAddress? ipAddress = null, CancellationToken ct = default);
    Task<IReadOnlyList<AuditLog>> GetByEntityAsync(string entityType, Guid entityId, int limit = 50, CancellationToken ct = default);
}
