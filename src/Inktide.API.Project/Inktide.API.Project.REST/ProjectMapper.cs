using Inktide.API.Core.Contracts;
using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.Domain.ValueObjects;
using Inktide.API.Project.REST.Models;

namespace Inktide.API.Project.REST;

internal static class ProjectMapper
{
    public static ProjectResponse MapToResponse(
        ProjectEntity p,
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
        ActiveModelId            = p.ActiveModelId,
        ActiveSceneId            = p.ActiveSceneId,
        SystemPrompt             = p.SystemPrompt,
        Personality              = p.Personality,
        PersonalityConfig        = p.PersonalityConfig,
        ResponseBehavior         = p.ResponseBehavior,
        ScreenAwarenessSettings  = p.ScreenAwarenessSettings,
        Status                   = p.Status,
        CreatedAt                = p.CreatedAt,
        UpdatedAt                = p.UpdatedAt,
        SortKey                  = p.SortKey,
        PreviewUrl               = p.PreviewUrl,
    };

    public static async Task<ProjectResponse> MapToResponseWithSoulAsync(
        ProjectEntity p,
        ICardSummaryProvider cardSummaries,
        CancellationToken ct)
    {
        ActiveSoulSummaryDto? soul = null;
        if (p.ActiveSoulId.HasValue)
        {
            var summaries = await cardSummaries.GetSummariesAsync([p.ActiveSoulId.Value], ct);
            if (summaries.TryGetValue(p.ActiveSoulId.Value, out var s))
                soul = new ActiveSoulSummaryDto { Id = s.Id, Name = s.Name, AvatarUrl = s.AvatarUrl };
        }
        return MapToResponse(p, null, soul);
    }

    public static ProjectPluginResponse MapPluginToResponse(ProjectPlugin p) => new()
    {
        PluginId  = p.PluginId,
        IsEnabled = p.IsEnabled,
        Config    = p.Config,
    };
}
