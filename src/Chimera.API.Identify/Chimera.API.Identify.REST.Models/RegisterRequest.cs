using Newtonsoft.Json;

namespace Chimera.API.Identify.REST.Models;

public class RegisterRequest
{
    private string _email = string.Empty;
    private string _password = string.Empty;
    private string? _displayName;

    [JsonProperty("email")]
    public string Email
    {
        get => _email;
        set => _email = value;
    }

    [JsonProperty("password")]
    public string Password
    {
        get => _password;
        set => _password = value;
    }

    [JsonProperty("displayName")]
    public string? DisplayName
    {
        get => _displayName;
        set => _displayName = value;
    }
}
