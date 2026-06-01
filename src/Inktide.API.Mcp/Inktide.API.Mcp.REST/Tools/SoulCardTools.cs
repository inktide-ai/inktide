using System.ComponentModel;
using System.Security.Claims;
using System.Text.RegularExpressions;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Entities;
using Microsoft.AspNetCore.Http;
using ModelContextProtocol.Server;

namespace Inktide.API.Mcp.REST.Tools;

[McpServerToolType]
public sealed class SoulCardTools(IAiCardService cardService, IHttpContextAccessor http)
{
    private Guid GetUserId()
    {
        var sub = http.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (sub is null || !Guid.TryParse(sub, out var id))
            throw new UnauthorizedAccessException("User ID not found in token.");
        return id;
    }

    [McpServerTool]
    [Description("List all soul cards owned by the current user. Returns id, name, slug, status and isActive for each card.")]
    public async Task<IReadOnlyList<SoulCardSummary>> ListSoulCardsAsync(CancellationToken ct)
    {
        try
        {
            var cards = await cardService.GetAllByUserAsync(GetUserId(), ct);
            return cards.Select(c => new SoulCardSummary(c.Id, c.Name, c.Slug, c.Status.ToString(), c.IsActive)).ToList();
        }
        catch (UnauthorizedAccessException) { throw; }
        catch (Exception ex)               { throw new InvalidOperationException(ex.Message); }
    }

    [McpServerTool]
    [Description("Get full details of a single soul card including personality, system prompt and avatar URL. Returns null when the card does not exist or belongs to another user.")]
    public async Task<SoulCardDetail?> GetSoulCardAsync(
        [Description("GUID of the soul card.")] Guid cardId,
        CancellationToken ct)
    {
        try
        {
            var card = await cardService.GetByIdAsync(GetUserId(), cardId, ct);
            return card is null ? null : ToDetail(card);
        }
        catch (UnauthorizedAccessException) { throw; }
        catch (Exception ex)               { throw new InvalidOperationException(ex.Message); }
    }

    [McpServerTool]
    [Description("Create a new AI soul card — a persistent character profile with personality and system prompt. The card can later be bound to platform channels so the AI agent starts responding. Returns the new card's GUID.")]
    public async Task<Guid> CreateSoulCardAsync(
        [Description("Display name shown in the UI (1-100 chars).")] string name,
        [Description("URL-safe slug (lowercase letters and hyphens). Auto-generated from name if omitted.")] string? slug,
        [Description("Freeform personality description for the AI character.")] string? personality,
        [Description("System prompt prepended to every LLM conversation.")] string? systemPrompt,
        CancellationToken ct)
    {
        try
        {
            var entity = new AiCard
            {
                Name                    = name,
                Slug                    = slug ?? SlugFromName(name),
                Personality             = personality ?? string.Empty,
                SystemPrompt            = systemPrompt ?? string.Empty,
                LlmConfig               = "{}",
                Appearance              = "{}",
                ResponseBehavior        = "{}",
                MemorySettings          = "{}",
                AutoPilot               = "{}",
                ScreenAwarenessSettings = "{}",
            };
            var created = await cardService.CreateAsync(GetUserId(), entity, ct: ct);
            return created.Id;
        }
        catch (UnauthorizedAccessException) { throw; }
        catch (Exception ex)               { throw new InvalidOperationException(ex.Message); }
    }

    [McpServerTool]
    [Description("Modify a soul card's identity — name, slug, personality or system prompt. Pass only the fields to change; omitted parameters keep their current values. Use after creation to refine the character.")]
    public async Task<OperationResult> UpdateSoulCardAsync(
        [Description("GUID of the soul card to update.")] Guid cardId,
        [Description("New display name.")] string? name,
        [Description("New URL-safe slug.")] string? slug,
        [Description("New personality description.")] string? personality,
        [Description("New system prompt.")] string? systemPrompt,
        CancellationToken ct)
    {
        try
        {
            var userId = GetUserId();
            var card   = await cardService.GetByIdAsync(userId, cardId, ct)
                ?? throw new InvalidOperationException($"Soul card {cardId} not found.");

            if (name         is not null) card.Name         = name;
            if (slug         is not null) card.Slug         = slug;
            if (personality  is not null) card.Personality  = personality;
            if (systemPrompt is not null) card.SystemPrompt = systemPrompt;

            await cardService.UpdateAsync(userId, card, ct);
            return OperationResult.Ok();
        }
        catch (UnauthorizedAccessException) { throw; }
        catch (Exception ex)               { return OperationResult.Fail(ex.Message); }
    }

    [McpServerTool]
    [Description("Permanently delete a soul card and all associated data. This disconnects any linked channels and cannot be undone. Call list_soul_cards first to confirm the correct cardId.")]
    public async Task<OperationResult> DeleteSoulCardAsync(
        [Description("GUID of the soul card to delete.")] Guid cardId,
        CancellationToken ct)
    {
        try
        {
            await cardService.DeleteAsync(GetUserId(), cardId, ct);
            return OperationResult.Ok();
        }
        catch (UnauthorizedAccessException) { throw; }
        catch (Exception ex)               { return OperationResult.Fail(ex.Message); }
    }

    [McpServerTool]
    [Description("'start' activates the AI agent so it responds in linked channels; 'pause' silences it temporarily; 'stop' fully deactivates it. Returns true when the card was found and the status was changed.")]
    public async Task<bool> ChangeSoulCardStatusAsync(
        [Description("GUID of the soul card.")] Guid cardId,
        [Description("Action to perform: 'start' to activate, 'pause' to pause, 'stop' to deactivate.")] string action,
        CancellationToken ct)
    {
        try
        {
            var card = await cardService.ChangeStatusAsync(GetUserId(), cardId, action, ct);
            return card is not null;
        }
        catch (UnauthorizedAccessException) { throw; }
        catch (Exception ex)               { throw new InvalidOperationException(ex.Message); }
    }

    private static SoulCardDetail ToDetail(AiCard c) =>
        new(c.Id, c.Name, c.Slug, c.Status.ToString(), c.IsActive,
            c.Personality, c.SystemPrompt, c.AvatarUrl);

    private static string SlugFromName(string name) =>
        Regex.Replace(name.ToLowerInvariant().Trim(), @"[^a-z0-9]+", "-").Trim('-');
}

public record SoulCardSummary(Guid Id, string Name, string Slug, string Status, bool IsActive);

public record SoulCardDetail(Guid Id, string Name, string Slug, string Status, bool IsActive,
    string Personality, string SystemPrompt, string? AvatarUrl);
