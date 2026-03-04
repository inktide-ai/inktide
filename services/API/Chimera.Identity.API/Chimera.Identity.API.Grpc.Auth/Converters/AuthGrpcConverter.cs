using Chimera.Identity.Application.Models.Auth;
using Chimera.Identity.API.Grpc.Contracts.Auth;

namespace Chimera.Identity.API.Grpc.Auth.Converters;

/// <summary>
/// Converts Application auth DTOs to gRPC proto messages.
/// </summary>
public static class AuthGrpcConverter
{
    /// <summary>
    /// Converts AuthResult to gRPC AuthResponse.
    /// </summary>
    public static AuthResponse ToAuthResponse(AuthResult result)
    {
        return new AuthResponse
        {
            AccessToken = result.AccessToken,
            TokenType = result.TokenType ?? "Bearer",
            ExpiresIn = result.ExpiresIn,
            RefreshToken = result.RefreshToken ?? string.Empty,
            RefreshExpiresIn = result.RefreshExpiresIn
        };
    }
}
