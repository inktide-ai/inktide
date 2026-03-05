using Newtonsoft.Json;

namespace Chimera.Identity.API.REST.Models;

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
