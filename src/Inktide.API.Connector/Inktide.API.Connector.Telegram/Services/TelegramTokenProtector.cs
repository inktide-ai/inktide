using Inktide.API.Connector.Application.OAuth;
using Microsoft.AspNetCore.DataProtection;

namespace Inktide.API.Connector.Telegram.Services;

internal sealed class TelegramTokenProtector : ITelegramTokenProtector
{
    private readonly DataProtectionTokenProtector _inner;

    public TelegramTokenProtector(IDataProtectionProvider provider)
        => _inner = new DataProtectionTokenProtector(provider, "Telegram.BotTokens");

    public string Protect(string plaintext)    => _inner.Protect(plaintext);
    public string Unprotect(string ciphertext) => _inner.Unprotect(ciphertext);
}
