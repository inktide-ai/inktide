namespace Chimera.API.Identify.Application.Models.Auth;

/// <summary>Tokens returned after a successful login, register, or refresh.</summary>
public sealed record AuthResult(
    string AccessToken,
    string TokenType,
    int ExpiresIn,
    string? RefreshToken = null,
    int RefreshExpiresIn = 0);
