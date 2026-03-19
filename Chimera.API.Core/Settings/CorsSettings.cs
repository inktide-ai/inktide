namespace Chimera.API.Core.Settings;

/// <summary>
/// CORS policy configuration.
/// Bound from the <c>Cors</c> configuration section.
/// </summary>
public sealed class CorsSettings
{
    #region Fields

    private string[] _allowedOrigins = [];

    #endregion

    #region Properties

    public string[] AllowedOrigins
    {
        get => _allowedOrigins;
        set => _allowedOrigins = value;
    }

    #endregion
}
