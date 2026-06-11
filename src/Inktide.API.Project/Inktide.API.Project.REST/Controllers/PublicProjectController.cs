using System.Text.Json;
using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace Inktide.API.Project.REST.Controllers;

[ApiController]
[Route("api/public/projects")]
[Produces("application/json")]
[AllowAnonymous]
public sealed class PublicProjectController : ControllerBase
{
    private readonly IProjectSceneConfigService _sceneConfig;
    private readonly ILogger<PublicProjectController> _logger;

    public PublicProjectController(IProjectSceneConfigService sceneConfig, ILogger<PublicProjectController> logger)
    {
        _sceneConfig = sceneConfig ?? throw new ArgumentNullException(nameof(sceneConfig));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    [HttpGet("{id:guid}/scene-config")]
    [ProducesResponseType(typeof(ProjectSceneConfigResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSceneConfig(Guid id, CancellationToken ct)
    {
        var result = await _sceneConfig.GetSceneConfigAsync(id, ct);
        if (result is null) return NotFound();

        var baselineMood = "neutral";
        try
        {
            using var doc = JsonDocument.Parse(result.PersonalityConfigJson);
            if (doc.RootElement.TryGetProperty("baseline_mood", out var moodEl))
                baselineMood = moodEl.GetString() ?? "neutral";
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Malformed PersonalityConfigJson for project {ProjectId}; falling back to neutral baseline mood.", id);
        }

        object? sceneConfig = null;
        if (result.SceneConfigJson is not null)
        {
            try { sceneConfig = JsonConvert.DeserializeObject(result.SceneConfigJson); }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Malformed SceneConfigJson for project {ProjectId}; returning null scene config.", id);
            }
        }

        return Ok(new ProjectSceneConfigResponse
        {
            SceneConfig  = sceneConfig,
            BaselineMood = baselineMood,
        });
    }
}
