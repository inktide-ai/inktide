namespace Inktide.API.Soul.Application.Models;

/// <summary>Decrypted BYOK credential — returned only within the server process, never serialised.</summary>
public sealed record DecryptedCredential(string ApiKey, string? BaseUrl, string? Config = null);
