using Microsoft.Extensions.Options;
using Chimera.ApiGateway.Application.Interfaces.Auth;
using Chimera.ApiGateway.Core.Settings;

namespace Chimera.ApiGateway.Application.Services;

/// <summary>BCrypt password hasher (Enhanced mode, handles passwords of any length).</summary>
internal sealed class BCryptPasswordHasher : IPasswordHasher
{
    #region Fields

    private readonly int _workFactor;

    #endregion

    #region Constructors

    public BCryptPasswordHasher(IOptions<AuthSettings> options)
    {
        _workFactor = options?.Value.BcryptWorkFactor ?? throw new ArgumentNullException(nameof(options));
    }

    #endregion

    #region Public Methods

    public string Hash(string password) =>
        BCrypt.Net.BCrypt.EnhancedHashPassword(password, _workFactor);

    public bool Verify(string password, string hash) =>
        BCrypt.Net.BCrypt.EnhancedVerify(password, hash);

    #endregion
}
