using Inktide.API.Core.Generators;
namespace Inktide.API.Project.Domain.Entities;

public sealed class ProjectChannel
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Platform { get; set; } = "twitch";
    public string ChannelName { get; set; } = string.Empty;
    public string? ChannelId { get; set; }
    public string BotUsername { get; set; } = string.Empty;
    public string? OAuthTokenEnc { get; set; }
    public string? RefreshTokenEnc { get; set; }
    public string? CustomBotTokenEnc { get; set; }
    public DateTime? TokenExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? ConnectedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public ProjectEntity? Project { get; set; }
}
