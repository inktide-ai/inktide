namespace Inktide.API.Soul.Application.Interfaces;

/// <summary>
/// Converts a human-readable name into a URL-safe slug.
/// SRP: slug rules (stripping, casing, separator) live in one place.
/// OCP: swap DefaultSlugGenerator for a unicode-aware one without touching AiCardService.
/// DIP: AiCardService depends on this abstraction, not on a concrete regex.
/// </summary>
public interface ISlugGenerator
{
    string Generate(string name);
}
