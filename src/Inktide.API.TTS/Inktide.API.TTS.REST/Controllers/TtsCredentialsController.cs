using System.Security.Claims;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Application.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.TTS.REST.Controllers;

/// <summary>
/// BYOK — per-user TTS provider credentials (ElevenLabs, Cartesia, etc.).
/// Shares the same <c>soul.user_provider_credentials</c> table as LLM credentials.
/// The actual API key is never returned in responses.
/// </summary>
[ApiController]
[Route("api/v1/tts/credentials")]
[Produces("application/json")]
[Authorize]
public sealed class TtsCredentialsController : ControllerBase
{
    private readonly IUserProviderCredentialService _service;

    public TtsCredentialsController(IUserProviderCredentialService service)
    {
        _service = service ?? throw new ArgumentNullException(nameof(service));
    }


    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<TtsCredentialResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
    {
        var userId = GetUserId();
        var results = await _service.GetAllAsync(userId, ct);
        return Ok(results.Select(ToResponse).ToList());
    }

    [HttpPut("{providerId}")]
    [ProducesResponseType(typeof(TtsCredentialResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Upsert(
        string providerId,
        [FromBody] UpsertTtsCredentialRequest? request,
        CancellationToken ct = default)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.ApiKey))
            return BadRequest(new { error = "api_key is required." });

        var userId = GetUserId();
        await _service.UpsertAsync(userId, providerId, request.ApiKey, baseUrl: null, config: null, ct);

        var all = await _service.GetAllAsync(userId, ct);
        var saved = all.FirstOrDefault(c => c.ProviderId == providerId);
        if (saved is null)
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Credential not found after save." });

        return Ok(ToResponse(saved));
    }

    [HttpDelete("{providerId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(string providerId, CancellationToken ct = default)
    {
        var userId = GetUserId();
        await _service.DeleteAsync(userId, providerId, ct);
        return NoContent();
    }


    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (sub is null || !Guid.TryParse(sub, out var userId))
            throw new UnauthorizedAccessException("User ID not found in token.");
        return userId;
    }

    private static TtsCredentialResponse ToResponse(UserProviderCredentialSummary c) =>
        new(c.ProviderId, c.HasKey, c.UpdatedAt, c.VerifiedAt, c.LastError);
}

public sealed record UpsertTtsCredentialRequest(string? ApiKey);

public sealed record TtsCredentialResponse(
    string ProviderId,
    bool HasKey,
    DateTime UpdatedAt,
    DateTime? VerifiedAt,
    string? LastError);
