namespace Chimera.API.Soul.Domain.Entities;

/// <summary>
/// Global catalog of available LLM models. Managed by admins.
/// AI cards reference this via FK to select their model.
/// </summary>
public sealed class LlmCatalogEntry
{
    #region Fields

    private Guid _id;
    private string _provider = string.Empty;
    private string _modelId = string.Empty;
    private string _displayName = string.Empty;
    private string _tier = "free";
    private bool _isAvailable = true;
    private DateTime _createdAt;

    #endregion

    #region Properties

    public Guid Id
    {
        get => _id;
        set => _id = value;
    }

    public string Provider
    {
        get => _provider;
        set => _provider = value;
    }

    public string ModelId
    {
        get => _modelId;
        set => _modelId = value;
    }

    public string DisplayName
    {
        get => _displayName;
        set => _displayName = value;
    }

    public string Tier
    {
        get => _tier;
        set => _tier = value;
    }

    public bool IsAvailable
    {
        get => _isAvailable;
        set => _isAvailable = value;
    }

    public DateTime CreatedAt
    {
        get => _createdAt;
        set => _createdAt = value;
    }

    #endregion
}
