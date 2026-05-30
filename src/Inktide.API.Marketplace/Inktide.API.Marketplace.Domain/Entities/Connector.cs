namespace Inktide.API.Marketplace.Domain.Entities;

public sealed class Connector
{
    private Connector() { }

    public Guid    Id               { get; private set; }
    public string  Slug             { get; private set; } = string.Empty;
    public string  Name             { get; private set; } = string.Empty;
    public string  Description      { get; private set; } = string.Empty;
    public string  ShortDescription { get; private set; } = string.Empty;
    public string  Category         { get; private set; } = string.Empty;
    public string  IconUrl          { get; private set; } = string.Empty;
    public bool    IsAvailable      { get; private set; }
    public bool    IsNative         { get; private set; }
    public string  AuthType         { get; private set; } = "none";
    public string  AuthorName       { get; private set; } = "Inktide";
    public string? WebsiteUrl       { get; private set; }
    public int     SortOrder        { get; private set; }
    public Guid?   ApplicationId    { get; private set; }

    public ICollection<ConnectorInstallation> Installations { get; private set; } = [];

    public static Connector Create(
        Guid    id,
        string  slug,
        string  name,
        string  description,
        string  shortDescription,
        string  category,
        string  iconUrl,
        bool    isAvailable,
        bool    isNative,
        string  authType,
        string  authorName,
        string? websiteUrl,
        int     sortOrder,
        Guid?   applicationId = null) => new()
    {
        Id               = id,
        Slug             = slug,
        Name             = name,
        Description      = description,
        ShortDescription = shortDescription,
        Category         = category,
        IconUrl          = iconUrl,
        IsAvailable      = isAvailable,
        IsNative         = isNative,
        AuthType         = authType,
        AuthorName       = authorName,
        WebsiteUrl       = websiteUrl,
        SortOrder        = sortOrder,
        ApplicationId    = applicationId,
    };
}
