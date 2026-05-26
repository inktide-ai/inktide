using System.Security.Cryptography;
using System.Text;

namespace Inktide.API.Billing.Infrastructure.Providers.Robokassa;

internal static class RobokassaSignature
{
    internal static string ComputeMd5Hex(string input)
    {
        var hash = MD5.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(hash).ToUpperInvariant();
    }
}
