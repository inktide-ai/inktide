using Inktide.API.Profile.Application.Interfaces;
using Inktide.API.Profile.Infrastructure.Constants;

namespace Inktide.API.Profile.Infrastructure.Services;

internal sealed class VerificationCodeGenerator : IVerificationCodeGenerator
{
    public string Generate()
    {
        var chars = ProfileConstants.EmailChange.CodeAlphabet;
        return new string(Enumerable.Range(0, ProfileConstants.EmailChange.CodeLength)
            .Select(_ => chars[Random.Shared.Next(chars.Length)]).ToArray());
    }
}
