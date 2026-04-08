using System.ComponentModel.DataAnnotations;

namespace Chimera.API.Connector.ChimeraChat.Models;

/// <summary>Request body for the browser chat send endpoint.</summary>
public sealed class ChimeraChatSendRequest
{
    /// <summary>Composite channel identifier: <c>"{cardId}:{userId}"</c>.</summary>
    [Required]
    public string ChannelId { get; set; } = string.Empty;

    /// <summary>Message text — 1 to 2 000 characters.</summary>
    [Required]
    [StringLength(2000, MinimumLength = 1)]
    public string Text { get; set; } = string.Empty;
}
