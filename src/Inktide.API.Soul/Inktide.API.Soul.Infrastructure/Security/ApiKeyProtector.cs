using Inktide.API.Soul.Application.Interfaces;
using Microsoft.AspNetCore.DataProtection;

namespace Inktide.API.Soul.Infrastructure.Security;

/// <summary>
/// Wraps ASP.NET Core Data Protection for encrypting/decrypting LLM provider API keys.
/// Purpose string is versioned so keys can be rotated in future (v1 -> v2 migration).
/// </summary>
public sealed class ApiKeyProtector : IApiKeyProtector
{

    private readonly IDataProtector _protector;


    public ApiKeyProtector(IDataProtectionProvider provider)
    {
        _protector = provider.CreateProtector("inktide.llm-credentials.v1");
    }


    public string Protect(string plainText) => _protector.Protect(plainText);

    public string Unprotect(string cipherText) => _protector.Unprotect(cipherText);

}
