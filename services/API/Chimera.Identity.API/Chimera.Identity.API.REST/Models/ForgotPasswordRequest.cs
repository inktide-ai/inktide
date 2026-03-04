namespace Chimera.Identity.API.REST.Models;

/// <summary>Request body for <c>POST /api/auth/forgot-password</c>.</summary>
public sealed class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}
