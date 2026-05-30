using Inktide.API.Marketplace.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Marketplace.Infrastructure.Configurations;

public sealed class ConnectorConfiguration : IEntityTypeConfiguration<Connector>
{
    // Deterministic seed GUIDs
    private static readonly Guid DiscordId  = new("00000000-0000-0000-0000-000000000001");
    private static readonly Guid TwitchId   = new("00000000-0000-0000-0000-000000000002");
    private static readonly Guid TelegramId = new("00000000-0000-0000-0000-000000000003");
    private static readonly Guid YouTubeId  = new("00000000-0000-0000-0000-000000000004");
    private static readonly Guid TikTokId   = new("00000000-0000-0000-0000-000000000005");

    public void Configure(EntityTypeBuilder<Connector> b)
    {
        b.ToTable("connectors", "marketplace");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.Slug).HasColumnName("slug").IsRequired().HasMaxLength(64);
        b.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(128);
        b.Property(e => e.Description).HasColumnName("description").IsRequired().HasMaxLength(512);
        b.Property(e => e.ShortDescription).HasColumnName("short_description").IsRequired().HasMaxLength(256);
        b.Property(e => e.Category).HasColumnName("category").IsRequired().HasMaxLength(64);
        b.Property(e => e.IconUrl).HasColumnName("icon_url").IsRequired().HasMaxLength(512);
        b.Property(e => e.IsAvailable).HasColumnName("is_available");
        b.Property(e => e.IsNative).HasColumnName("is_native");
        b.Property(e => e.AuthType).HasColumnName("auth_type").IsRequired().HasMaxLength(32);
        b.Property(e => e.AuthorName).HasColumnName("author_name").IsRequired().HasMaxLength(128);
        b.Property(e => e.WebsiteUrl).HasColumnName("website_url").HasMaxLength(512);
        b.Property(e => e.SortOrder).HasColumnName("sort_order");
        b.Property(e => e.ApplicationId).HasColumnName("application_id");

        b.HasIndex(e => e.Slug).IsUnique();

        // FK relationship is defined in ConnectorInstallationConfiguration (the owning side).
        // Defining it here too would create a hidden ordering dependency — removed.

        b.HasData(
            Connector.Create(DiscordId,  "discord",  "Discord",  "Route guild messages to your AI character in real-time.",          "Route guild messages to your AI character",    "Chat",   "/icons/connectors/discord.svg",  true,  true,  "oauth",   "Inktide", null,                        1),
            Connector.Create(TwitchId,   "twitch",   "Twitch",   "Let your character react to live chat and stream events.",          "Read and respond to Twitch chat live",         "Stream", "/icons/connectors/twitch.svg",   true,  true,  "oauth",   "Inktide", null,                        2),
            Connector.Create(TelegramId, "telegram", "Telegram", "Connect a Telegram bot to relay chat messages to your AI.",         "Telegram bot token — no OAuth needed",         "Chat",   "/icons/connectors/telegram.svg", true,  true,  "apikey",  "Inktide", null,                        3),
            Connector.Create(YouTubeId,  "youtube",  "YouTube",  "Connect live stream chat to drive AI responses.",                   "YouTube Live chat (coming soon)",              "Stream", "/icons/connectors/youtube.svg",  false, false, "oauth",   "Inktide", "https://youtube.com",       4),
            Connector.Create(TikTokId,   "tiktok",   "TikTok",   "Engage your TikTok live audience with AI replies.",                 "TikTok LIVE comments (coming soon)",           "Stream", "/icons/connectors/tiktok.svg",   false, false, "webhook", "Inktide", "https://developers.tiktok.com", 5)
        );
    }
}
