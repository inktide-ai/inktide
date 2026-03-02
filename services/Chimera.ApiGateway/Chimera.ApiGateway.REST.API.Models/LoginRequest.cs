using Newtonsoft.Json;

namespace Chimera.ApiGateway.REST.API.Models;

public class LoginRequest
{
    private string? _apiKey;
    private string? _username;
    private string? _email;
    private string? _password;

    [JsonProperty("apiKey")]
    public string? ApiKey
    {
        get => _apiKey;
        set => _apiKey = value;
    }

    [JsonProperty("username")]
    public string? Username
    {
        get => _username;
        set => _username = value;
    }

    [JsonProperty("email")]
    public string? Email
    {
        get => _email;
        set => _email = value;
    }

    [JsonProperty("password")]
    public string? Password
    {
        get => _password;
        set => _password = value;
    }
}
