using System.ComponentModel;
using System.Security.Claims;
using Inktide.API.Soul.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using ModelContextProtocol.Server;

namespace Inktide.API.Mcp.REST.Tools;

/// <summary>
/// Channel link tools — channel management has moved to the Project context.
/// These tools are stubs until the Project context exposes channel CRUD.
/// </summary>
[McpServerToolType]
public sealed class ChannelLinkTools(
    IAiCardService cardService,
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
    [Description("Channel management has moved to the Project context. This tool is currently unavailable.")]
    public Task<IReadOnlyList<ChannelLinkInfo>> ListLinkedChannelsAsync(
        [Description("GUID of the soul card.")] Guid cardId,
        CancellationToken ct)
    {
        return Task.FromResult<IReadOnlyList<ChannelLinkInfo>>([]);
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
