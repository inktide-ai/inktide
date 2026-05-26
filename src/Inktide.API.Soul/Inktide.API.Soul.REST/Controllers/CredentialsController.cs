using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.REST.Mappers;
using Inktide.API.Soul.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Soul.REST.Controllers;

/// <summary>
/// BYOK — per-user LLM provider credentials.
/// The actual API key is never returned in responses.
/// </summary>
[ApiController]
[Route("api/soul/credentials")]
[Produces("application/json")]
[Authorize]
public sealed class CredentialsController : ApiController
{

    private readonly IUserProviderCredentialService _service;


    public CredentialsController(IUserProviderCredentialService service)
    {
        _service = service ?? throw new ArgumentNullException(nameof(service));
    }


    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CredentialResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
    {
        var userId  = GetUserId();
        var results = await _service.GetAllAsync(userId, ct);
        return Ok(results.Select(CredentialResponseMapper.ToResponse).ToList());
    }

    [HttpPut("{providerId}")]
    [ProducesResponseType(typeof(CredentialResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Upsert(
        string providerId,
        [FromBody] UpsertCredentialRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return BadRequest(ApiErrorResponse.From("Request body is required.", ErrorCodes.ValidationError));

        var userId = GetUserId();
        await _service.UpsertAsync(userId, providerId, request.ApiKey ?? string.Empty, request.BaseUrl, request.Config, ct);

        var all = await _service.GetAllAsync(userId, ct);
        var saved = all.FirstOrDefault(c => c.ProviderId == providerId);
        if (saved is null)
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiErrorResponse.From("Credential not found after upsert.", ErrorCodes.ServiceUnavailable));

        return Ok(CredentialResponseMapper.ToResponse(saved));
    }

    [HttpDelete("{providerId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(string providerId, CancellationToken ct = default)
    {
        var userId = GetUserId();
        await _service.DeleteAsync(userId, providerId, ct);
        return NoContent();
    }

    [HttpPost("{providerId}/test")]
    [ProducesResponseType(typeof(CredentialTestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Test(string providerId, CancellationToken ct = default)
    {
        var userId = GetUserId();
        var result = await _service.TestAndPersistAsync(userId, providerId, ct);

        if (result.Error == "No credential stored.")
            return NotFound(ApiErrorResponse.From($"No credential found for provider '{providerId}'.", ErrorCodes.NotFound));

        return Ok(new CredentialTestResponse(result.Success, result.Error, DateTime.UtcNow));
    }


}
