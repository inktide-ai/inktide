using System.Security.Claims;
using Inktide.API.Core;
using Inktide.API.Core.Contracts;
using Inktide.API.Core.Pagination;
using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace Inktide.API.Project.REST.Controllers;

[ApiController]
[Route("api/v1/projects")]
[Produces("application/json")]
[Authorize]
public sealed class ProjectController : ControllerBase
{
    private readonly IProjectCrudService _projects;
    private readonly IProjectOrderingService _ordering;
    private readonly IProjectPluginService _plugins;
    private readonly IProjectImportService _importer;
    private readonly IProjectExportService _exporter;
    private readonly IInktFileImportService _inktImporter;
    private readonly ICardSummaryProvider _cardSummaries;
    private readonly IProjectSceneConfigService _sceneConfig;

    public ProjectController(
        IProjectCrudService projects,
        IProjectOrderingService ordering,
        IProjectPluginService plugins,
        IProjectImportService importer,
        IProjectExportService exporter,
        IInktFileImportService inktImporter,
        ICardSummaryProvider cardSummaries,
        IProjectSceneConfigService sceneConfig)
    {
        _projects      = projects      ?? throw new ArgumentNullException(nameof(projects));
        _ordering      = ordering      ?? throw new ArgumentNullException(nameof(ordering));
        _plugins       = plugins       ?? throw new ArgumentNullException(nameof(plugins));
        _importer      = importer      ?? throw new ArgumentNullException(nameof(importer));
        _exporter      = exporter      ?? throw new ArgumentNullException(nameof(exporter));
        _inktImporter  = inktImporter  ?? throw new ArgumentNullException(nameof(inktImporter));
        _cardSummaries = cardSummaries ?? throw new ArgumentNullException(nameof(cardSummaries));
        _sceneConfig   = sceneConfig   ?? throw new ArgumentNullException(nameof(sceneConfig));
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ProjectResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromQuery] Guid? soulId,
        [FromQuery] int limit = 50,
        [FromQuery] string? cursor = null,
        CancellationToken ct = default)
    {
        if (limit is < 1 or > 200) limit = 50;
        var userId = GetUserId();
        var paged  = soulId.HasValue
            ? await _projects.ListBySoulPagedAsync(userId, soulId.Value, limit, cursor, ct)
            : await _projects.ListPagedAsync(userId, limit, cursor, ct);
        var souls = await _cardSummaries.GetSummariesAsync(
            paged.Items.Where(p => p.ActiveSoulId.HasValue).Select(p => p.ActiveSoulId!.Value), ct);
        var items = paged.Items.Select(p => ProjectMapper.MapToResponse(p, souls)).ToList();
        return Ok(new PagedResult<ProjectResponse>(items, paged.NextCursor, paged.HasMore));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateProjectRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Name is required." });

        var userId  = GetUserId();
        var project = await _projects.CreateAsync(userId, request.Name, request.Description, request.ActiveSoulId, request.Personality, request.PersonalityConfig, request.ResponseBehavior, request.ScreenAwarenessSettings, ct);
        return Created($"/api/projects/{project.Id}", await ProjectMapper.MapToResponseWithSoulAsync(project, _cardSummaries, ct));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var userId  = GetUserId();
        var project = await _projects.GetAsync(id, userId, ct);
        if (project is null) return NotFound();
        return Ok(await ProjectMapper.MapToResponseWithSoulAsync(project, _cardSummaries, ct));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProjectRequest request, CancellationToken ct)
    {
        var userId = GetUserId();
        try
        {
            var project = await _projects.UpdateAsync(id, userId, request.Name, request.Description, request.Status, request.ActiveModelId, request.ActiveSceneId, request.SystemPrompt, request.Personality, request.PersonalityConfig, request.ResponseBehavior, request.ScreenAwarenessSettings, ct);
            return Ok(await ProjectMapper.MapToResponseWithSoulAsync(project, _cardSummaries, ct));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();
        try
        {
            await _projects.DeleteAsync(id, userId, ct);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPut("{id:guid}/soul")]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> BindSoul(Guid id, [FromBody] BindSoulRequest request, CancellationToken ct)
    {
        var userId = GetUserId();
        try
        {
            var project = await _projects.BindSoulAsync(id, userId, request.SoulId, ct);
            return Ok(await ProjectMapper.MapToResponseWithSoulAsync(project, _cardSummaries, ct));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id:guid}/soul")]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UnbindSoul(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();
        try
        {
            var project = await _projects.UnbindSoulAsync(id, userId, ct);
            return Ok(await ProjectMapper.MapToResponseWithSoulAsync(project, _cardSummaries, ct));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }


    [HttpPost("export")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Export([FromBody] ExportProjectRequest? request, CancellationToken ct)
    {
        if (request is null)
            return BadRequest(new { error = "Request body is required." });

        var result = await _exporter.ExportAsync(GetUserId(), request.ProjectId, ct);
        if (result is null)
            return NotFound(new { error = "Project not found." });

        return File(result.ZipContent, "application/zip", result.FileName);
    }

    [HttpPost("import/parse")]
    [RequestSizeLimit(52_428_800)]  // 50 MB
    [ProducesResponseType(typeof(InktFileParseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ParseImport(IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });
        if (!file.FileName.EndsWith(".inkt", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "File must be a .inkt archive." });

        await using var stream = file.OpenReadStream();
        var result = await _inktImporter.ParseAsync(GetUserId(), stream, ct);

        if (result.Errors.Count > 0)
            return BadRequest(new { errors = result.Errors });

        return Ok(new InktFileParseResponse
        {
            ParseToken     = result.ParseToken,
            ProjectName    = result.ProjectName,
            SoulName       = result.SoulName,
            HasGraph       = result.HasGraph,
            ConnectorCount = result.ConnectorCount,
            LlmModelId     = result.LlmModelId,
            LlmProvider    = result.LlmProvider,
            TtsVoiceId     = result.TtsVoiceId,
            TtsProvider    = result.TtsProvider,
            Warnings       = result.Warnings.ToList(),
        });
    }

    [HttpPost("import/finalize")]
    [ProducesResponseType(typeof(ImportProjectResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> FinalizeImport([FromBody] FinalizeImportRequest? request, CancellationToken ct)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.ParseToken))
            return BadRequest(new { error = "parse_token is required." });

        try
        {
            var result = await _inktImporter.FinalizeAsync(
                GetUserId(),
                new InktFileFinalizeCommand(
                    request.ParseToken,
                    request.TargetSoulId,
                    request.ImportConnectorsDisabled ?? true),
                ct);

            return Created(
                $"/api/projects/{result.ProjectId}",
                new ImportProjectResponse { ProjectId = result.ProjectId, SoulId = result.SoulId });
        }
        catch (InvalidOperationException)
        {
            return BadRequest(new { error = "Import validation failed." });
        }
    }


    [HttpGet("{id:guid}/plugins")]
    [ProducesResponseType(typeof(IReadOnlyList<ProjectPluginResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPlugins(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();
        try
        {
            var plugins = await _plugins.GetPluginsAsync(id, userId, ct);
            return Ok(plugins.Select(ProjectMapper.MapPluginToResponse).ToList());
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPut("{id:guid}/plugins/{pluginId}")]
    [ProducesResponseType(typeof(ProjectPluginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpsertPlugin(
        Guid id, string pluginId, [FromBody] UpsertPluginRequest request, CancellationToken ct)
    {
        var userId = GetUserId();
        try
        {
            var plugin = await _plugins.UpsertPluginAsync(id, userId, pluginId, request.IsEnabled, request.Config, ct);
            return Ok(ProjectMapper.MapPluginToResponse(plugin));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPatch("{id:guid}/scene-config")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSceneConfig(Guid id, [FromBody] UpdateSceneConfigRequest request, CancellationToken ct)
    {
        if (request.SceneConfig is null) return BadRequest(new { error = "scene_config is required." });
        var userId = GetUserId();
        try
        {
            var json = JsonConvert.SerializeObject(request.SceneConfig);
            await _sceneConfig.UpdateSceneConfigAsync(id, userId, json, ct);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("User ID not found in token.");
        return Guid.Parse(sub);
    }

    /// <summary>Move a project to a new position. previousId=null -> beginning; nextId=null -> end.</summary>
    [HttpPatch("{id:guid}/position")]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reorder(
        Guid id, [FromBody] ReorderProjectRequest? body, CancellationToken ct = default)
    {
        if (body is null) return BadRequest(new { error = "Request body is required." });
        var userId = GetUserId();

        var project = await _ordering.ReorderAsync(id, userId, body.PreviousId, body.NextId, ct).ConfigureAwait(false);
        if (project is null) return NotFound(new { error = "Project not found." });

        return Ok(await ProjectMapper.MapToResponseWithSoulAsync(project, _cardSummaries, ct));
    }
}
