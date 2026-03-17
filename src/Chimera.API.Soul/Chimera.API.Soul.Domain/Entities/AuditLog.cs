using System.Net;

namespace Chimera.API.Soul.Domain.Entities;

/// <summary>
/// Lightweight change tracking. Stores diffs as JSONB instead of full version chains.
/// Replaces full versioning for MVP.
/// </summary>
public sealed class AuditLog
{
    #region Fields

    private Guid _id;
    private Guid _userId;
    private string _entityType = string.Empty;
    private Guid _entityId;
    private string _action = string.Empty;
    private string? _changes;
    private IPAddress? _ipAddress;
    private DateTime _createdAt;

    #endregion

    #region Properties

    public Guid Id
    {
        get => _id;
        set => _id = value;
    }

    public Guid UserId
    {
        get => _userId;
        set => _userId = value;
    }

    /// <summary>ai_card, channel, subscription, etc.</summary>
    public string EntityType
    {
        get => _entityType;
        set => _entityType = value;
    }

    public Guid EntityId
    {
        get => _entityId;
        set => _entityId = value;
    }

    /// <summary>created, updated, deleted, activated</summary>
    public string Action
    {
        get => _action;
        set => _action = value;
    }

    /// <summary>JSON diff: {"field": {"old": "...", "new": "..."}}</summary>
    public string? Changes
    {
        get => _changes;
        set => _changes = value;
    }

    public IPAddress? IpAddress
    {
        get => _ipAddress;
        set => _ipAddress = value;
    }

    public DateTime CreatedAt
    {
        get => _createdAt;
        set => _createdAt = value;
    }

    #endregion
}
