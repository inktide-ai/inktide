using System.Text.RegularExpressions;
using Inktide.API.Soul.Application.Interfaces;

namespace Inktide.API.Soul.Application.Services;

/// <summary>
/// ASCII slug generator: lowercases, strips special characters, collapses whitespace to dashes.
/// SRP: slug policy lives here exclusively.
/// OCP: replace with UnicodeSlugGenerator by swapping the ISlugGenerator registration.
/// </summary>
public sealed partial class DefaultSlugGenerator : ISlugGenerator
{
    public string Generate(string name)
    {
        var slug = name.ToLowerInvariant().Trim();
        slug = SlugInvalidChars().Replace(slug, "");
        slug = SlugWhitespace().Replace(slug, "-");
        slug = slug.Trim('-');
        return string.IsNullOrEmpty(slug) ? "ai-card" : slug;
    }

    [GeneratedRegex(@"[^a-z0-9\s-]")]
    private static partial Regex SlugInvalidChars();

    [GeneratedRegex(@"\s+")]
    private static partial Regex SlugWhitespace();
}
