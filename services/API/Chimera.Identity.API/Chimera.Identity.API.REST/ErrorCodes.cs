namespace Chimera.Identity.API.REST;

/// <summary>Machine-readable error code constants returned in <c>ApiErrorResponse.Code</c>.</summary>
public static class ErrorCodes
{
    public const string ValidationError      = "VALIDATION_ERROR";
    public const string UserExists           = "USER_EXISTS";
    public const string Conflict             = "CONFLICT";
    public const string InvalidCredentials   = "INVALID_CREDENTIALS";
    public const string InvalidRefreshToken  = "INVALID_REFRESH_TOKEN";
    public const string InternalError        = "INTERNAL_ERROR";
    public const string Unauthorized         = "UNAUTHORIZED";
}
