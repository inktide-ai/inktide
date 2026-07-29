using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.REST.Mappers;
using Inktide.API.Soul.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Soul.REST.Controllers;

[ApiController]
[Route("api/v1/soul/catalog")]
[Produces("application/json")]
[Authorize]
public sealed class CatalogController : ApiController
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
        var models = await _catalogService.GetAvailableLlmModelsAsync(ct);
        return Ok(models.Select(CatalogResponseMapper.ToLlmResponse).ToList());
    }

    [HttpGet("tts-voices")]
    [ProducesResponseType(typeof(IReadOnlyList<TtsVoiceResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTtsVoices(CancellationToken ct)
    {
        var voices = await _catalogService.GetAvailableTtsVoicesAsync(ct);
        return Ok(voices.Select(CatalogResponseMapper.ToTtsResponse).ToList());
    }

    // Deprecated aliases - 301 Permanent Redirect
    [HttpGet("/api/soul/catalog/llm-models")]
    public IActionResult GetLlmModelsLegacy() =>
        RedirectPermanent("/api/v1/soul/catalog/llm-models");

    [HttpGet("/api/soul/catalog/tts-voices")]
    public IActionResult GetTtsVoicesLegacy() =>
        RedirectPermanent("/api/v1/soul/catalog/tts-voices");


}
