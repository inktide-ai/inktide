namespace Chimera.API.Soul.Application.Models;

/// <summary>
/// Safe read model — never exposes the raw API key.
/// </summary>
public sealed record UserProviderCredentialSummary(
    string ProviderId,
    bool HasKey,
    string? BaseUrl,
    string? Config,
    DateTime UpdatedAt);
