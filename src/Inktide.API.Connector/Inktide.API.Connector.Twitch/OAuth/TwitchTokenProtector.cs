using Inktide.API.Connector.Application.OAuth;
using Microsoft.AspNetCore.DataProtection;

namespace Inktide.API.Connector.Twitch.OAuth;

internal sealed class TwitchTokenProtector : ITwitchTokenProtector
{
    private readonly DataProtectionTokenProtector _inner;

    public TwitchTokenProtector(IDataProtectionProvider provider)
        => _inner = new DataProtectionTokenProtector(provider, "Twitch.OAuth.Tokens");

    public string Protect(string plaintext)    => _inner.Protect(plaintext);
    public string Unprotect(string ciphertext) => _inner.Unprotect(ciphertext);
}
