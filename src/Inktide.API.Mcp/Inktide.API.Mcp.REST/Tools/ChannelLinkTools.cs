using System.ComponentModel;
using System.Security.Claims;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Application.Models;
using Microsoft.AspNetCore.Http;
using ModelContextProtocol.Server;

namespace Inktide.API.Mcp.REST.Tools;

[McpServerToolType]
public sealed class ChannelLinkTools(
    IAiCardService cardService,
    IAiCardChannelCrudService channelCrud,
    IHttpContextAccessor http)
{
    private Guid GetUserId()
    {
        var sub = http.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (sub is null || !Guid.TryParse(sub, out var id))
            throw new UnauthorizedAccessException("User ID not found in token.");
        return id;
    }

    [McpServerTool]
    [Description("List all platform channels linked to a soul card. Returns id, platform, channelName, channelId, botUsername, isActive and connectedAt for each link.")]
    public async Task<IReadOnlyList<ChannelLinkInfo>> ListLinkedChannelsAsync(
        [Description("GUID of the soul card.")] Guid cardId,
        CancellationToken ct)
    {
        try
        {
            var card = await cardService.GetByIdAsync(GetUserId(), cardId, ct);
            if (card is null) return [];

            return [..card.Channels.Select(ch => new ChannelLinkInfo(
                ch.Id, ch.Platform, ch.ChannelName, ch.ChannelId,
                ch.BotUsername, ch.IsActive, ch.ConnectedAt))];
        }
        catch (UnauthorizedAccessException) { throw; }
        catch (Exception ex)               { throw new InvalidOperationException(ex.Message); }
    }

    [McpServerTool]
    [Description("Link a Discord, Twitch, or Telegram channel to a soul card so the AI agent starts responding in that channel. Returns the new link's GUID. Use list_linked_channels to see existing links.")]
    public async Task<Guid> LinkChannelToSoulAsync(
        [Description("GUID of the soul card to link the channel to.")] Guid cardId,
        [Description("Platform name: 'discord', 'twitch', or 'telegram'.")] string platform,
        [Description("Human-readable channel name (e.g. #general or channel title).")] string channelName,
        [Description("Platform-specific channel ID (numeric or string). Optional for some platforms.")] string? channelId,
        [Description("Username of the bot that will operate in this channel.")] string botUsername,
        CancellationToken ct)
    {
        try
        {
            var cmd  = new CreateChannelLinkCommand(platform, channelName, channelId, botUsername);
            var link = await channelCrud.CreateAsync(GetUserId(), cardId, cmd, ct);
            return link.Id;
        }
        catch (UnauthorizedAccessException) { throw; }
        catch (Exception ex)               { throw new InvalidOperationException(ex.Message); }
    }

    [McpServerTool]
    [Description("Permanently remove a platform channel's connection to a soul card — the AI agent stops responding in that channel. Use list_linked_channels first to find the correct linkId. Cannot be undone.")]
    public async Task<OperationResult> UnlinkChannelFromSoulAsync(
        [Description("GUID of the soul card that owns the link.")] Guid cardId,
        [Description("GUID of the channel link to remove.")] Guid linkId,
        CancellationToken ct)
    {
        try
        {
            await channelCrud.DeleteAsync(GetUserId(), cardId, linkId, ct);
            return OperationResult.Ok();
        }
        catch (UnauthorizedAccessException) { throw; }
        catch (Exception ex)               { return OperationResult.Fail(ex.Message); }
    }
}

public record ChannelLinkInfo(
    Guid Id,
    string Platform,
    string ChannelName,
    string? ChannelId,
    string BotUsername,
    bool IsActive,
    DateTime? ConnectedAt);
