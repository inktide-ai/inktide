namespace Inktide.API.Soul.Application.Interfaces;

/// <summary>
/// Application-level activity query service.
/// DIP: REST controllers depend on this abstraction, not on the domain IAuditLogRepository directly.
/// SRP: activity projection logic lives here, controllers stay as thin HTTP adapters.
/// </summary>
public interface IAiCardActivityService
{
    Task<IReadOnlyList<AiCardActivityEntry>> GetRecentAsync(
        string entityType, Guid entityId, int limit = 20, CancellationToken ct = default);
}

/// <summary>A projected, read-only activity record for controller consumption.</summary>
public sealed record AiCardActivityEntry(Guid Id, string Action, DateTime CreatedAt);
