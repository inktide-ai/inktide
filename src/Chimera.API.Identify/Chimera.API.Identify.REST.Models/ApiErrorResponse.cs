using Newtonsoft.Json;

namespace Chimera.API.Identify.REST.Models;

/// <summary>
/// Unified API error response.
/// </summary>
public sealed record ApiErrorResponse(
    [property: JsonProperty("error")] string Error,
    [property: JsonProperty("code")] string? Code)
{
    public static ApiErrorResponse From(string message, string? code = null) =>
        new ApiErrorResponse(message, code);
}
