using System.Text.Json.Serialization;

namespace Inktide.API.Core;

/// <summary>
/// Standard error envelope returned by all API endpoints on 4xx/5xx responses.
/// </summary>
public sealed class ApiErrorResponse
{
    [JsonPropertyName("error")]
    public string Error { get; set; } = string.Empty;

    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    public static ApiErrorResponse From(string error, string code) =>
        new() { Error = error, Code = code };
}
