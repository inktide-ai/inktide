using Chimera.Identity.Application.Interfaces.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Chimera.Identity.API.REST.Converters;
using Chimera.Identity.API.REST.Models;

namespace Chimera.Identity.API.REST.Controllers;

/// <summary>Authentication endpoints: register, login, refresh, logout.</summary>
[ApiController]
[Route("api/auth")]
[Produces("application/json")]
[EnableRateLimiting("auth")]
public sealed class AuthController : ControllerBase
{
    #region Fields

    private readonly IAuthService _authService;
    private readonly IPasswordResetService _passwordResetService;

    #endregion

    #region Constructors

    public AuthController(IAuthService authService, IPasswordResetService passwordResetService)
    {
        _authService = authService ?? throw new ArgumentNullException(nameof(authService));
        _passwordResetService = passwordResetService ?? throw new ArgumentNullException(nameof(passwordResetService));
    }

    #endregion

    #region Public Methods

    /// <summary>Creates a new user account and returns tokens.</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest? request, CancellationToken ct)
    {
        if (request is null)
        {
            return BadRequest(ApiErrorResponse.From("Request body is required.", ErrorCodes.ValidationError));
        }

        var result = await _authService.RegisterAsync(request.Email, request.Password, request.DisplayName, ct);

        return Ok(AuthConverter.ToLoginResponse(result));
    }

    /// <summary>Authenticates via API key or email+password and returns tokens.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Login([FromBody] LoginRequest? request, CancellationToken ct)
    {
        if (request is null)
        {
            return Unauthorized(ApiErrorResponse.From("Request body is required.", ErrorCodes.ValidationError));
        }

        var emailOrUser = request.Email ?? request.Username;
        var result = await _authService.LoginAsync(request.ApiKey, emailOrUser, request.Password, ct);

        if (result is null)
        {
            return Unauthorized(ApiErrorResponse.From("Invalid credentials.", ErrorCodes.InvalidCredentials));
        }

        return Ok(AuthConverter.ToLoginResponse(result));
    }

    /// <summary>Exchanges a refresh token for new access and refresh tokens.</summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest? request, CancellationToken ct)
    {
        if (request is null)
        {
            return BadRequest(ApiErrorResponse.From("Request body is required.", ErrorCodes.ValidationError));
        }

        var result = await _authService.RefreshAsync(request.RefreshToken, ct);

        if (result is null)
        {
            return Unauthorized(ApiErrorResponse.From("Invalid or expired refresh token.", ErrorCodes.InvalidRefreshToken));
        }

        return Ok(AuthConverter.ToLoginResponse(result));
    }

    /// <summary>Revokes the refresh token, ending the session. Safe to call multiple times.</summary>
    [HttpPost("logout")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Logout([FromBody] RefreshRequest? request, CancellationToken ct)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return BadRequest(ApiErrorResponse.From("Refresh token is required.", ErrorCodes.ValidationError));
        }

        await _authService.LogoutAsync(request.RefreshToken, ct);

        return NoContent();
    }

    /// <summary>
    /// Sends a password-reset link to the given email.
    /// Always returns 204 regardless of whether the email is registered (prevents enumeration).
    /// </summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequest? request,
        CancellationToken ct)
    {
        if (request is null)
        {
            return BadRequest(ApiErrorResponse.From("Request body is required.", ErrorCodes.ValidationError));
        }

        await _passwordResetService.RequestResetAsync(request.Email, ct);

        return NoContent();
    }

    /// <summary>Validates the reset token and sets the new password.</summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordRequest? request,
        CancellationToken ct)
    {
        if (request is null)
        {
            return BadRequest(ApiErrorResponse.From("Request body is required.", ErrorCodes.ValidationError));
        }

        var success = await _passwordResetService.ResetPasswordAsync(request.Token, request.NewPassword, ct);

        if (!success)
        {
            return BadRequest(ApiErrorResponse.From(
                "Invalid or expired reset token.",
                ErrorCodes.InvalidRefreshToken));
        }

        return NoContent();
    }

    #endregion
}
