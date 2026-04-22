namespace Chimera.API.Soul.Application.Interfaces;

/// <summary>
/// Encrypts and decrypts API key strings at the application layer.
/// Implemented in Infrastructure using ASP.NET Core Data Protection.
/// </summary>
public interface IApiKeyProtector
{
    string Protect(string plainText);
    string Unprotect(string cipherText);
}
