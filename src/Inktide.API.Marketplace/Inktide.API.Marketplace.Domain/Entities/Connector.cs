namespace Inktide.API.Marketplace.Domain.Entities;

public sealed class Connector
{
    private Connector() { }

    public Guid   Id          { get; private set; }
    public string Slug        { get; private set; } = string.Empty;
    public string Name        { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string Category    { get; private set; } = string.Empty;
    public string IconUrl     { get; private set; } = string.Empty;
    public bool   IsAvailable { get; private set; }
    public int    SortOrder   { get; private set; }

    public ICollection<ConnectorInstallation> Installations { get; private set; } = [];

    public static Connector Create(
        Guid   id,
        string slug,
        string name,
        string description,
        string category,
        string iconUrl,
        bool   isAvailable,
        int    sortOrder) => new()
    {
        Id          = id,
        Slug        = slug,
        Name        = name,
        Description = description,
        Category    = category,
        IconUrl     = iconUrl,
        IsAvailable = isAvailable,
        SortOrder   = sortOrder,
    };
}
