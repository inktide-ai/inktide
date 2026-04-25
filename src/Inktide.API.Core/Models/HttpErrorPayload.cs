using System.Text.Json.Serialization;

namespace Inktide.API.Core.Models;

/// <summary>
/// JSON body for unhandled API errors (aligned with Soul <c>ApiErrorResponse</c> shape: error + code).
/// </summary>
public sealed class HttpErrorPayload
{

    private string _error = string.Empty;
    private string _code = string.Empty;


    [JsonPropertyName("error")]
    public string Error
    {
        get => _error;
        set => _error = value;
    }

    [JsonPropertyName("code")]
    public string Code
    {
        get => _code;
        set => _code = value;
    }

    /// <summary>W3C trace / request id for support correlation.</summary>
    [JsonPropertyName("traceId")]
    public string? TraceId
    {
        get;
        set;
    }

    /// <summary>Present only in Development when an unexpected exception occurs.</summary>
    [JsonPropertyName("detail")]
    public string? Detail
    {
        get;
        set;
    }


    public static HttpErrorPayload Internal(string traceId, bool includeDetail, string? exceptionDetail)
    {
        return new HttpErrorPayload
        {
            Error = "An unexpected error occurred.",
            Code = HttpErrorCodes.InternalError,
            TraceId = traceId,
            Detail = includeDetail ? exceptionDetail : null
        };
    }

}

/// <summary>Stable machine-readable codes for Core HTTP JSON errors (global handler).</summary>
public static class HttpErrorCodes
{
    public const string InternalError = "internal_error";
}
