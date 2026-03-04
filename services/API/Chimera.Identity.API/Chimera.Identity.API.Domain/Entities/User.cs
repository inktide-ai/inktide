namespace Chimera.Identity.Domain.Entities;

/// <summary>
/// User aggregate root.
/// </summary>
public sealed class User
{
    private Guid _id;
    private string _email = string.Empty;
    private string _passwordHash = string.Empty;
    private string? _displayName;
    private string _role = "streamer";
    private bool _isActive = true;
    private DateTime _createdAt;
    private DateTime _updatedAt;

    public Guid Id
    {
        get => _id;
        set => _id = value;
    }

    public string Email
    {
        get => _email;
        set => _email = value;
    }

    public string PasswordHash
    {
        get => _passwordHash;
        set => _passwordHash = value;
    }

    public string? DisplayName
    {
        get => _displayName;
        set => _displayName = value;
    }

    public string Role
    {
        get => _role;
        set => _role = value;
    }

    public bool IsActive
    {
        get => _isActive;
        set => _isActive = value;
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
}
