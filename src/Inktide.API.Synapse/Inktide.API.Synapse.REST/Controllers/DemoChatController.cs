using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Inktide.API.Synapse.REST.Controllers;

[ApiController]
[Route("api/v1/demo")]
[Produces("application/json")]
public sealed class DemoChatController : ControllerBase
{
    private readonly IDemoChatService _demo;

    public DemoChatController(IDemoChatService demo)
    {
        _demo = demo ?? throw new ArgumentNullException(nameof(demo));
    }

    [HttpPost("chat")]
    [AllowAnonymous]
    [EnableRateLimiting(SynapseRestStartup.DemoChatRateLimitPolicy)]
    [ProducesResponseType(typeof(DemoChatResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> ChatAsync(
        [FromBody] DemoChatRequest request,
        CancellationToken cancellationToken)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Text))
            return BadRequest(new { error = "Text is required." });

        if (request.Text.Length > 500)
            return BadRequest(new { error = "Message too long (max 500 chars)." });

        try
        {
            var result = await _demo.ChatAsync(request.Text, request.History, cancellationToken)
                .ConfigureAwait(false);

            if (result is null)
                return Problem(
                    detail: "Default chat provider is not registered or the LLM service is not running.",
                    statusCode: StatusCodes.Status503ServiceUnavailable);

            return Ok(new DemoChatResponse { Text = result.Text, Model = result.Model });
        }
        catch (HttpRequestException)
        {
            return Problem(
                detail: "Could not reach LLM provider. Make sure Ollama (or configured provider) is running.",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }
}
