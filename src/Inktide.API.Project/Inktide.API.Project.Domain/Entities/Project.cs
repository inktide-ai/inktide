using Inktide.API.Core.Generators;
using Inktide.API.Project.Domain.ValueObjects;
namespace Inktide.API.Project.Domain.Entities;

public sealed class ProjectEntity
{
    private Guid _id;
    private Guid _userId;
    private string _name = string.Empty;
    private string? _description;
    private Guid? _activeSoulId;
    private string _status = "active";
    private DateTime _createdAt;
    private DateTime _updatedAt;

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

    public string Name
    {
        get => _name;
        set => _name = value;
    }

    public string? Description
    {
        get => _description;
        set => _description = value;
    }

    public Guid? ActiveSoulId
    {
        get => _activeSoulId;
        set => _activeSoulId = value;
    }

    public Guid? ActiveModelId { get; set; }
    public Guid? ActiveSceneId { get; set; }
    public string? SystemPrompt { get; set; }

    public string Status
    {
        get => _status;
        set => _status = value;
    }

    public DateTime CreatedAt
    {
        get => _createdAt;
        set => _createdAt = value;
    }

    public DateTime UpdatedAt
    {
        get => _updatedAt;
        set => _updatedAt = value;
    }

    /// <summary>Fractional index key for drag-and-drop ordering. Sorts lexicographically ASC.</summary>
    public string SortKey { get; set; } = "a0";

    /// <summary>EF Core value converter serializes this to/from plugins_json column.</summary>
    public List<ProjectPlugin> Plugins { get; set; } = [];

    public void SetSortKey(string key)
    {
        if (string.IsNullOrEmpty(key)) throw new ArgumentException("sort key required", nameof(key));
        SortKey = key;
    }

    public static ProjectEntity Create(Guid userId, string name, string? description, Guid? activeSoulId)
    {
        return new ProjectEntity
        {
            Id           = IdGenerator.New(),
            UserId       = userId,
            Name         = name,
            Description  = description,
            ActiveSoulId = activeSoulId,
            Status       = "active",
            CreatedAt    = DateTime.UtcNow,
            UpdatedAt    = DateTime.UtcNow,
        };
    }
}
