using System.ComponentModel;
using System.Security.Claims;
using Inktide.API.Project.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using ModelContextProtocol.Server;

namespace Inktide.API.Mcp.REST.Tools;

[McpServerToolType]
public sealed class ProjectTools(IProjectCrudService projectService, IHttpContextAccessor http)
{
    private Guid GetUserId()
    {
        var sub = http.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (sub is null || !Guid.TryParse(sub, out var id))
            throw new UnauthorizedAccessException("User ID not found in token.");
        return id;
    }

    [McpServerTool]
    [Description("List all projects owned by the current user. Returns id, name, description, status and the bound soul card id for each project. Use list_soul_cards first if you need soul card names.")]
    public async Task<IReadOnlyList<ProjectSummary>> ListProjectsAsync(CancellationToken ct)
    {
        try
        {
            var projects = await projectService.ListAsync(GetUserId(), ct);
            return projects.Select(p => new ProjectSummary(p.Id, p.Name, p.Description, p.Status, p.ActiveSoulId)).ToList();
        }
        catch (UnauthorizedAccessException) { throw; }
        catch (Exception ex)               { throw new InvalidOperationException(ex.Message); }
    }

    [McpServerTool]
    [Description("Retrieve full configuration of a project by GUID, including name, description, status and the bound soul card id. Returns null when the project does not exist or belongs to another user.")]
    public async Task<ProjectSummary?> GetProjectAsync(
        [Description("GUID of the project.")] Guid projectId,
        CancellationToken ct)
    {
        try
        {
            var p = await projectService.GetAsync(projectId, GetUserId(), ct);
            return p is null ? null : new ProjectSummary(p.Id, p.Name, p.Description, p.Status, p.ActiveSoulId);
        }
        catch (UnauthorizedAccessException) { throw; }
        catch (Exception ex)               { throw new InvalidOperationException(ex.Message); }
    }

    [McpServerTool]
    [Description("Create a new workspace project that groups a soul card and configuration for a specific stream or use-case. Optionally bind a soul card immediately via soulId. Returns the new project's GUID.")]
    public async Task<Guid> CreateProjectAsync(
        [Description("Project display name.")] string name,
        [Description("Optional description of the project.")] string? description,
        [Description("GUID of the soul card to bind immediately, or omit to bind later.")] Guid? soulId,
        CancellationToken ct)
    {
        try
        {
            var project = await projectService.CreateAsync(GetUserId(), name, description, soulId, ct: ct);
            return project.Id;
        }
        catch (UnauthorizedAccessException) { throw; }
        catch (Exception ex)               { throw new InvalidOperationException(ex.Message); }
    }

    [McpServerTool]
    [Description("Modify an existing project's name, description, status or system prompt. Pass only the fields to change; omitted parameters keep their current values.")]
    public async Task<OperationResult> UpdateProjectAsync(
        [Description("GUID of the project to update.")] Guid projectId,
        [Description("New display name.")] string? name,
        [Description("New description.")] string? description,
        [Description("New status: 'active' or 'archived'.")] string? status,
        [Description("New system prompt for the project.")] string? systemPrompt,
        CancellationToken ct)
    {
        try
        {
            var userId  = GetUserId();
            var current = await projectService.GetAsync(projectId, userId, ct)
                ?? throw new InvalidOperationException($"Project {projectId} not found.");

            await projectService.UpdateAsync(
                projectId, userId,
                name        ?? current.Name,
                description ?? current.Description,
                status      ?? current.Status,
                activeModelId: null,
                activeSceneId: null,
                systemPrompt ?? current.SystemPrompt,
                ct: ct);
            return OperationResult.Ok();
        }
        catch (UnauthorizedAccessException) { throw; }
        catch (Exception ex)               { return OperationResult.Fail(ex.Message); }
    }

    [McpServerTool]
    [Description("Permanently delete a project and all its configuration. Cannot be undone. Call list_projects first to confirm the correct projectId.")]
    public async Task<OperationResult> DeleteProjectAsync(
        [Description("GUID of the project to delete.")] Guid projectId,
        CancellationToken ct)
    {
        try
        {
            await projectService.DeleteAsync(projectId, GetUserId(), ct);
            return OperationResult.Ok();
        }
        catch (UnauthorizedAccessException) { throw; }
        catch (Exception ex)               { return OperationResult.Fail(ex.Message); }
    }

    [McpServerTool]
    [Description("Bind a soul card to a project so the AI agent becomes active for that project. Replaces any previously bound soul. Use list_soul_cards to find the correct soulId.")]
    public async Task<OperationResult> BindSoulToProjectAsync(
        [Description("GUID of the project.")] Guid projectId,
        [Description("GUID of the soul card to bind.")] Guid soulId,
        CancellationToken ct)
    {
        try
        {
            await projectService.BindSoulAsync(projectId, GetUserId(), soulId, ct);
            return OperationResult.Ok();
        }
        catch (UnauthorizedAccessException) { throw; }
        catch (Exception ex)               { return OperationResult.Fail(ex.Message); }
    }

    [McpServerTool]
    [Description("Remove the soul card currently bound to a project so the AI agent stops being active for it. Use before binding a different soul or when decommissioning the project's AI.")]
    public async Task<OperationResult> UnbindSoulFromProjectAsync(
        [Description("GUID of the project.")] Guid projectId,
        CancellationToken ct)
    {
        try
        {
            await projectService.UnbindSoulAsync(projectId, GetUserId(), ct);
            return OperationResult.Ok();
        }
        catch (UnauthorizedAccessException) { throw; }
        catch (Exception ex)               { return OperationResult.Fail(ex.Message); }
    }
}

public record ProjectSummary(Guid Id, string Name, string? Description, string Status, Guid? ActiveSoulId);
