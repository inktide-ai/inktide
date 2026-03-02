using Newtonsoft.Json;

namespace Chimera.ApiGateway.REST.API.Models;

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
