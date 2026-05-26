using Inktide.API.Core.Generators;
using System.Net;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Repositories;
using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Soul.Infrastructure.Repositories;

public sealed class AuditLogRepository : IAuditLogRepository
{

    private readonly SoulDbContext _db;
    private readonly TimeProvider _time;


    public AuditLogRepository(SoulDbContext db, TimeProvider time)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _time = time ?? throw new ArgumentNullException(nameof(time));
    }


    public Task LogAsync(Guid userId, string entityType, Guid entityId, string action,
        string? changes = null, IPAddress? ipAddress = null, CancellationToken ct = default)
    {
        var entry = new AuditLog
        {
            Id = IdGenerator.New(),
            UserId = userId,
            EntityType = entityType,
            EntityId = entityId,
            Action = action,
            Changes = changes,
            IpAddress = ipAddress,
            CreatedAt = _time.GetUtcNow().UtcDateTime
        };

        _db.AuditLogs.Add(entry);
        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<AuditLog>> GetByEntityAsync(Guid userId, string entityType, Guid entityId, int limit = 50, CancellationToken ct = default)
    {
        return await _db.AuditLogs
            .AsNoTracking()
            .Where(a => a.UserId == userId && a.EntityType == entityType && a.EntityId == entityId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(limit)
            .ToListAsync(ct);
    }

}
