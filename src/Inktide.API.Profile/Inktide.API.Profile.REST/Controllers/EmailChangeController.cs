using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Inktide.API.Core;
using Inktide.API.Profile.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Profile.REST.Controllers;

[ApiController]
[Route("api/v1/me/email-change")]
[Produces("application/json")]
[Authorize]
public sealed class EmailChangeController : ControllerBase
{
    private readonly IEmailChangeService _emailChange;

    public EmailChangeController(IEmailChangeService emailChange)
    {
        _emailChange = emailChange ?? throw new ArgumentNullException(nameof(emailChange));
    }

    /// <summary>Send a verification code to the new email address.</summary>
    [HttpPost("request")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RequestEmailChange(
        [FromBody] RequestEmailChangeDto dto,
        CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.NewEmail))
            return BadRequest(ApiErrorResponse.From("Email is required.", "VALIDATION_ERROR"));

        try
        {
            await _emailChange.RequestChangeAsync(userId, dto.NewEmail.Trim().ToLowerInvariant(), ct);
            return Ok();
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { detail = "Failed to send verification email. Please try again." });
        }
    }

    /// <summary>Verify the code and commit the email change.</summary>
    [HttpPost("verify")]
    [ProducesResponseType(typeof(VerifyEmailChangeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Verify([FromBody] VerifyEmailChangeDto dto, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.Code))
            return BadRequest(ApiErrorResponse.From("Code is required.", "VALIDATION_ERROR"));

        var newEmail = await _emailChange.VerifyAndChangeAsync(userId, dto.Code.Trim(), ct);
        if (newEmail is null)
            return BadRequest(ApiErrorResponse.From("Invalid or expired code.", "INVALID_CODE"));

        return Ok(new VerifyEmailChangeResponse { NewEmail = newEmail });
    }
}

public sealed class RequestEmailChangeDto
{
    [Required, EmailAddress]
    public string NewEmail { get; set; } = string.Empty;
}

public sealed class VerifyEmailChangeDto
{
    [Required]
    public string Code { get; set; } = string.Empty;
}

public sealed class VerifyEmailChangeResponse
{
    public string NewEmail { get; set; } = string.Empty;
}
