using Chimera.ApiGateway.Application.Models.Auth;
using Chimera.ApiGateway.REST.API.Models;

namespace Chimera.ApiGateway.REST.API.Converters;

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
