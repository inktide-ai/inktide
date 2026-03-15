using Chimera.API.Identify.Application.Models.Auth;
using Chimera.API.Identify.REST.Models;

namespace Chimera.API.Identify.REST.Converters;

/// <summary>
/// Converts Application auth DTOs to REST API response models.
/// </summary>
public static class AuthConverter
{
    public static LoginResponse ToLoginResponse(AuthResult result)
    {
        return new LoginResponse(
            result.AccessToken,
            result.TokenType,
            result.ExpiresIn,
            result.RefreshToken,
            result.RefreshExpiresIn);
    }
}
