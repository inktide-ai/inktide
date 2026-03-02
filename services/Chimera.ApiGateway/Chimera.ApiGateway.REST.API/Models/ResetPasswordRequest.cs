namespace Chimera.ApiGateway.REST.API.Models;

/// <summary>Request body for <c>POST /api/auth/reset-password</c>.</summary>
public sealed class ResetPasswordRequest
{
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
