using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Chimera.Identity.Application.Interfaces.Auth;
using Chimera.Identity.Application.Models.Auth;
using Chimera.Identity.API.Core.Settings;

namespace Chimera.Identity.Application.Services;

/// <summary>Issues signed JWT access tokens (HS256) and cryptographically random refresh tokens.</summary>
public sealed class TokenService : ITokenService
{
    #region Fields

    // Thread-safe and stateless — safe to share as a singleton.
    private static readonly JsonWebTokenHandler TokenHandler = new();

    private readonly AuthSettings _settings;
    private readonly SigningCredentials _signingCredentials;

    #endregion

    #region Constructors

    public TokenService(IOptions<AuthSettings> options)
    {
        _settings = options?.Value ?? throw new ArgumentNullException(nameof(options));

        if (string.IsNullOrWhiteSpace(_settings.Secret) || _settings.Secret.Length < 32)
        {
            throw new InvalidOperationException(
                "AuthSettings.Secret must be at least 32 characters. " +
                "Set it via User Secrets (dev) or an environment variable (prod).");
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
        _signingCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    }

    #endregion

    #region Public Methods

    /// <inheritdoc/>
    public IssuedToken GenerateAccessToken(string userId, string role)
    {
        var lifetime = TimeSpan.FromMinutes(_settings.AccessTokenMinutes);
        var now = DateTime.UtcNow;

        var descriptor = new SecurityTokenDescriptor
        {
            Issuer = _settings.Issuer,
            Audience = _settings.Audience,
            Subject = new ClaimsIdentity(
            [
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("role", role),
            ]),
            IssuedAt = now,
            NotBefore = now,
            Expires = now.Add(lifetime),
            SigningCredentials = _signingCredentials,
        };

        return new IssuedToken(TokenHandler.CreateToken(descriptor), lifetime);
    }

    /// <inheritdoc/>
    public IssuedToken GenerateRefreshToken()
    {
        var lifetime = TimeSpan.FromDays(_settings.RefreshTokenDays);

        Span<byte> bytes = stackalloc byte[32];
        RandomNumberGenerator.Fill(bytes);

        return new IssuedToken(Convert.ToBase64String(bytes), lifetime);
    }

    #endregion
}
