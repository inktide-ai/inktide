using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Repositories;

namespace Inktide.API.Soul.Application.Services;

/// <summary>
/// Wraps IAuditLogRepository and projects log entries into a controller-safe DTO.
/// DIP: REST controllers depend on IAiCardActivityService (application abstraction),
///      not on IAuditLogRepository (domain/infrastructure port).
/// SRP: activity projection logic lives here, not scattered across controllers.
/// </summary>
public sealed class AiCardActivityService : IAiCardActivityService
{
    private readonly IAuditLogRepository _auditLog;

    public AiCardActivityService(IAuditLogRepository auditLog)
    {
        _auditLog = auditLog ?? throw new ArgumentNullException(nameof(auditLog));
    }

    public async Task<IReadOnlyList<AiCardActivityEntry>> GetRecentAsync(
        Guid userId, string entityType, Guid entityId, int limit = 20, CancellationToken ct = default)
    {
        var logs = await _auditLog.GetByEntityAsync(userId, entityType, entityId, limit, ct).ConfigureAwait(false);
        return logs.Select(l => new AiCardActivityEntry(l.Id, l.Action, l.CreatedAt)).ToList();
    }
}
