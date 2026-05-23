using Inktide.API.Marketplace.Domain.Entities;

namespace Inktide.API.Marketplace.REST.Models;

public sealed record ConnectorDto(
    Guid   Id,
    string Slug,
    string Name,
    string Description,
    string Category,
    string IconUrl,
    bool   IsAvailable,
    int    SortOrder)
{
    public static ConnectorDto From(Connector c) => new(
        c.Id, c.Slug, c.Name, c.Description, c.Category, c.IconUrl, c.IsAvailable, c.SortOrder);
}
