using System.Security.Claims;
using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace Inktide.API.Project.REST.Controllers;

[ApiController]
[Route("api/projects")]
[Produces("application/json")]
[Authorize]
public sealed class ProjectController : ControllerBase
{
    private readonly IProjectService _projects;
    private readonly IProjectImportService _importer;
    private readonly IProjectExportService _exporter;
    private readonly IInktFileImportService _inktImporter;
    private readonly ICardSummaryProvider _cardSummaries;

    public ProjectController(
        IProjectService projects,
        IProjectImportService importer,
        IProjectExportService exporter,
        IInktFileImportService inktImporter,
        ICardSummaryProvider cardSummaries)
    {
        _projects      = projects      ?? throw new ArgumentNullException(nameof(projects));
        _importer      = importer      ?? throw new ArgumentNullException(nameof(importer));
        _exporter      = exporter      ?? throw new ArgumentNullException(nameof(exporter));
        _inktImporter  = inktImporter  ?? throw new ArgumentNullException(nameof(inktImporter));
        _cardSummaries = cardSummaries ?? throw new ArgumentNullException(nameof(cardSummaries));
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ProjectResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List([FromQuery] Guid? soulId, CancellationToken ct)
    {
        var userId   = GetUserId();
        var projects = soulId.HasValue
            ? await _projects.ListBySoulAsync(userId, soulId.Value, ct)
            : await _projects.ListAsync(userId, ct);
        var souls = await _cardSummaries.GetSummariesAsync(
            projects.Where(p => p.ActiveSoulId.HasValue).Select(p => p.ActiveSoulId!.Value), ct);
        return Ok(projects.Select(p => MapToResponse(p, souls)).ToList());
    }

    [HttpPost]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateProjectRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Name is required." });

        var userId  = GetUserId();
        var project = await _projects.CreateAsync(userId, request.Name, request.Description, request.ActiveSoulId, ct);
        return Created($"/api/projects/{project.Id}", await MapToResponseWithSoulAsync(project, ct));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var userId  = GetUserId();
        var project = await _projects.GetAsync(id, userId, ct);
        if (project is null) return NotFound();
        return Ok(await MapToResponseWithSoulAsync(project, ct));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProjectRequest request, CancellationToken ct)
    {
        var userId = GetUserId();
        try
        {
            var project = await _projects.UpdateAsync(id, userId, request.Name, request.Description, request.Status, request.ActiveModelId, request.ActiveSceneId, request.SystemPrompt, ct);
            return Ok(await MapToResponseWithSoulAsync(project, ct));
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
            return Ok(await MapToResponseWithSoulAsync(project, ct));
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
            return Ok(await MapToResponseWithSoulAsync(project, ct));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    // ── New ZIP-based export/import ──────────────────────────────────────────

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
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // ── Legacy JSON import (kept for backwards compatibility) ────────────────

    /// <remarks>Deprecated: use POST /api/projects/import/parse + /api/projects/import/finalize instead.</remarks>
    [HttpPost("import")]
    [ProducesResponseType(typeof(ImportProjectResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Import([FromBody] InktProjectDto? dto, CancellationToken ct)
    {
        if (dto is null)
            return BadRequest(new { error = "Invalid .inkt file." });

        var userId = GetUserId();

        InktSoulCommand? soulCmd = null;
        if (dto.Soul is not null)
        {
            var s = dto.Soul;
            soulCmd = new InktSoulCommand(
                s.Name,
                s.Personality,
                s.SystemPrompt,
                s.AvatarUrl,
                s.Description,
                s.Status,
                s.CoverUrl,
                s.LlmCatalogId,
                s.LlmConfig is not null ? JsonConvert.SerializeObject(s.LlmConfig) : "{}",
                s.TtsCatalogId,
                s.TtsConfig is not null ? JsonConvert.SerializeObject(s.TtsConfig) : null,
                s.Appearance is not null ? JsonConvert.SerializeObject(s.Appearance) : "{}",
                s.ResponseBehavior is not null ? JsonConvert.SerializeObject(s.ResponseBehavior) : "{}",
                s.MemorySettings is not null ? JsonConvert.SerializeObject(s.MemorySettings) : "{}",
                s.AutoPilot is not null ? JsonConvert.SerializeObject(s.AutoPilot) : "{}");
        }

        var graphJson = dto.Graph is not null ? JsonConvert.SerializeObject(dto.Graph) : null;

        var command = new ImportProjectCommand(
            ProjectName: dto.Name.Length > 0 ? dto.Name : "Imported Project",
            Soul: soulCmd,
            GraphPayloadJson: graphJson);

        var result = await _importer.ImportAsync(userId, command, ct);

        return Created(
            $"/api/projects/{result.ProjectId}",
            new ImportProjectResponse { ProjectId = result.ProjectId, SoulId = result.SoulId });
    }

    // ── Plugin management ─────────────────────────────────────────────────────

    [HttpGet("{id:guid}/plugins")]
    [ProducesResponseType(typeof(IReadOnlyList<ProjectPluginResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPlugins(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();
        try
        {
            var plugins = await _projects.GetPluginsAsync(id, userId, ct);
            return Ok(plugins.Select(MapPluginToResponse).ToList());
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
            var plugin = await _projects.UpsertPluginAsync(id, userId, pluginId, request.IsEnabled, request.Config, ct);
            return Ok(MapPluginToResponse(plugin));
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

    private static ProjectPluginResponse MapPluginToResponse(Domain.ValueObjects.ProjectPlugin p) => new()
    {
        PluginId  = p.PluginId,
        IsEnabled = p.IsEnabled,
        Config    = p.Config,
    };

    /// <summary>Move a project to a new position. previousId=null → beginning; nextId=null → end.</summary>
    [HttpPut("{id:guid}/position")]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reorder(
        Guid id, [FromBody] ReorderProjectRequest? body, CancellationToken ct = default)
    {
        if (body is null) return BadRequest(new { error = "Request body is required." });
        var userId = GetUserId();

        var project = await _projects.ReorderAsync(id, userId, body.PreviousId, body.NextId, ct).ConfigureAwait(false);
        if (project is null) return NotFound(new { error = "Project not found." });

        return Ok(await MapToResponseWithSoulAsync(project, ct));
    }

    private async Task<ProjectResponse> MapToResponseWithSoulAsync(
        Domain.Entities.ProjectEntity p, CancellationToken ct)
    {
        ActiveSoulSummaryDto? soul = null;
        if (p.ActiveSoulId.HasValue)
        {
            var summaries = await _cardSummaries.GetSummariesAsync([p.ActiveSoulId.Value], ct);
            if (summaries.TryGetValue(p.ActiveSoulId.Value, out var s))
                soul = new ActiveSoulSummaryDto { Id = s.Id, Name = s.Name, AvatarUrl = s.AvatarUrl };
        }
        return MapToResponse(p, null, soul);
    }

    private static ProjectResponse MapToResponse(
        Domain.Entities.ProjectEntity p,
        IReadOnlyDictionary<Guid, CardSummary>? souls,
        ActiveSoulSummaryDto? soulOverride = null) => new()
    {
        Id            = p.Id,
        UserId        = p.UserId,
        Name          = p.Name,
        Description   = p.Description,
        ActiveSoulId  = p.ActiveSoulId,
        ActiveSoul    = soulOverride ?? (p.ActiveSoulId.HasValue && souls?.TryGetValue(p.ActiveSoulId.Value, out var s) == true
            ? new ActiveSoulSummaryDto { Id = s!.Id, Name = s.Name, AvatarUrl = s.AvatarUrl }
            : null),
        ActiveModelId = p.ActiveModelId,
        ActiveSceneId = p.ActiveSceneId,
        SystemPrompt  = p.SystemPrompt,
        Status        = p.Status,
        CreatedAt     = p.CreatedAt,
        UpdatedAt     = p.UpdatedAt,
        SortKey       = p.SortKey,
    };
}
