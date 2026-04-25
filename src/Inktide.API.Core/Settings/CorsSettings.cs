namespace Inktide.API.Core.Settings;

public sealed class CorsSettings
{

    private string[] _allowedOrigins = [];


    public string[] AllowedOrigins
    {
        get => _allowedOrigins;
        set => _allowedOrigins = value;
    }

}
