using Inktide.API.Marketplace.Domain.Entities;

namespace Inktide.API.Marketplace.REST.Models;

public sealed record ConnectorDto(
    Guid    Id,
    string  Slug,
    string  Name,
    string  Description,
    string  ShortDescription,
    string  Category,
    string  IconUrl,
    bool    IsAvailable,
    bool    IsNative,
    string  AuthType,
    string  AuthorName,
    string? WebsiteUrl,
    int     SortOrder,
    Guid?   ApplicationId)
{
    public static ConnectorDto From(Connector c) => new(
        c.Id, c.Slug, c.Name, c.Description, c.ShortDescription,
        c.Category, c.IconUrl, c.IsAvailable, c.IsNative,
        c.AuthType, c.AuthorName, c.WebsiteUrl, c.SortOrder, c.ApplicationId);
}
