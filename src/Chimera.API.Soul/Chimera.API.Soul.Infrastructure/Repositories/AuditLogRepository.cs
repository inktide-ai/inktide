using System.Net;
using Chimera.API.Soul.Domain.Entities;
using Chimera.API.Soul.Domain.Repositories;
using Chimera.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Chimera.API.Soul.Infrastructure.Repositories;

public sealed class AuditLogRepository : IAuditLogRepository
{
    #region Fields

    private readonly SoulDbContext _db;
    private readonly TimeProvider _time;

    #endregion

    #region Constructors

    public AuditLogRepository(SoulDbContext db, TimeProvider time)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _time = time ?? throw new ArgumentNullException(nameof(time));
    }

    #endregion

    #region Public Methods

    public async Task LogAsync(Guid userId, string entityType, Guid entityId, string action,
        string? changes = null, IPAddress? ipAddress = null, CancellationToken ct = default)
    {
        var entry = new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            EntityType = entityType,
            EntityId = entityId,
            Action = action,
            Changes = changes,
            IpAddress = ipAddress,
            CreatedAt = _time.GetUtcNow().UtcDateTime
        };

        _db.AuditLogs.Add(entry);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<AuditLog>> GetByEntityAsync(string entityType, Guid entityId, int limit = 50, CancellationToken ct = default)
    {
        return await _db.AuditLogs
            .AsNoTracking()
            .Where(a => a.EntityType == entityType && a.EntityId == entityId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(limit)
            .ToListAsync(ct);
    }

    #endregion
}
