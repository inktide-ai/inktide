using Newtonsoft.Json;

namespace Chimera.API.Soul.REST.Models;

public sealed class ApiErrorResponse
{

    private string _error = string.Empty;
    private string _code = string.Empty;


    [JsonProperty("error")]
    public string Error
    {
        get => _error;
        set => _error = value;
    }

    [JsonProperty("code")]
    public string Code
    {
        get => _code;
        set => _code = value;
    }


    public static ApiErrorResponse From(string error, string code) => new() { Error = error, Code = code };

}
