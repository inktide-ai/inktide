using Inktide.API.Connector.Application.OAuth;
using Microsoft.AspNetCore.DataProtection;

namespace Inktide.API.Connector.Discord.OAuth;

internal sealed class DiscordTokenProtector : IDiscordTokenProtector
{
    private readonly DataProtectionTokenProtector _inner;

    public DiscordTokenProtector(IDataProtectionProvider provider)
        => _inner = new DataProtectionTokenProtector(provider, "Discord.OAuth.Tokens");

    public string Protect(string plaintext)    => _inner.Protect(plaintext);
    public string Unprotect(string ciphertext) => _inner.Unprotect(ciphertext);
}
