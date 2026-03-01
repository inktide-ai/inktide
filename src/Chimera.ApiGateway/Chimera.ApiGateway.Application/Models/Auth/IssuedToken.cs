namespace Chimera.ApiGateway.Application.Models.Auth;

/// <summary>A token string paired with its lifetime. Used for both access and refresh tokens.</summary>
public sealed record IssuedToken(string Value, TimeSpan Lifetime)
{
    #region Properties

    public int LifetimeSeconds => (int)Lifetime.TotalSeconds;

    #endregion
}
