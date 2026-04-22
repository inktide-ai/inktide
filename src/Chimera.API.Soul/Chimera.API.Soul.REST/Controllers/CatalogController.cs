using System.Security.Claims;
using Chimera.API.Soul.Application.Interfaces;
using Chimera.API.Soul.REST.Converters;
using Chimera.API.Soul.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Chimera.API.Soul.REST.Controllers;

[ApiController]
[Route("api/soul/catalog")]
[Produces("application/json")]
[Authorize]
public sealed class CatalogController : ControllerBase
{

    private readonly ICatalogService _catalogService;


    public CatalogController(ICatalogService catalogService)
    {
        _catalogService = catalogService ?? throw new ArgumentNullException(nameof(catalogService));
    }


    [HttpGet("llm-models")]
    [ProducesResponseType(typeof(IReadOnlyList<LlmModelResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLlmModels(CancellationToken ct)
    {
        var userId = GetUserId();
        var models = await _catalogService.GetAvailableLlmModelsAsync(userId, ct);
        return Ok(models.Select(AiCardConverter.ToLlmResponse).ToList());
    }

    [HttpGet("tts-voices")]
    [ProducesResponseType(typeof(IReadOnlyList<TtsVoiceResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTtsVoices(CancellationToken ct)
    {
        var userId = GetUserId();
        var voices = await _catalogService.GetAvailableTtsVoicesAsync(userId, ct);
        return Ok(voices.Select(AiCardConverter.ToTtsResponse).ToList());
    }


    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("User ID not found in token.");
        return Guid.Parse(sub);
    }

}
