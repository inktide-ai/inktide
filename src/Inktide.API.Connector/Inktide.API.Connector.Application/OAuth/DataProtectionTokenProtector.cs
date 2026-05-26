using Microsoft.AspNetCore.DataProtection;

namespace Inktide.API.Connector.Application.OAuth;

/// <summary>
/// <see cref="ITokenProtector"/> backed by ASP.NET Core Data Protection.
/// Each instance is constructed with a platform-specific <paramref name="purpose"/> string,
/// ensuring cross-platform decryption is cryptographically impossible.
/// </summary>
public sealed class DataProtectionTokenProtector : ITokenProtector
{
    private readonly IDataProtector _protector;

    public DataProtectionTokenProtector(IDataProtectionProvider provider, string purpose)
        => _protector = provider.CreateProtector(purpose);

    public string Protect(string plaintext)    => _protector.Protect(plaintext);
    public string Unprotect(string ciphertext) => _protector.Unprotect(ciphertext);
}
