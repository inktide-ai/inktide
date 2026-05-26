namespace Inktide.API.Connector.Application.OAuth;

/// <summary>
/// Encrypts and decrypts short-lived OAuth tokens at rest.
/// Registered as two keyed singletons — one per platform — so Discord tokens
/// cannot be decrypted with the Twitch protector and vice versa.
/// </summary>
public interface ITokenProtector
{
    string Protect(string plaintext);
    string Unprotect(string ciphertext);
}
