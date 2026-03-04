using Newtonsoft.Json;

namespace Chimera.Identity.API.REST.Models;

public class RefreshRequest
{
    private string _refreshToken = string.Empty;

    [JsonProperty("refreshToken")]
    public string RefreshToken
    {
        get => _refreshToken;
        set => _refreshToken = value ?? string.Empty;
    }
}
