namespace Inktide.API.Soul.REST.Models;

public sealed record UpsertCredentialRequest(string? ApiKey, string? BaseUrl, string? Config = null);

public sealed record CredentialResponse(
    string ProviderId,
    bool HasKey,
    string? BaseUrl,
    string? Config,
    DateTime UpdatedAt);
