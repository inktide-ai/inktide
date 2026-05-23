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
        b.Property(e => e.Category).HasColumnName("category").IsRequired().HasMaxLength(64);
        b.Property(e => e.IconUrl).HasColumnName("icon_url").IsRequired().HasMaxLength(512);
        b.Property(e => e.IsAvailable).HasColumnName("is_available");
        b.Property(e => e.SortOrder).HasColumnName("sort_order");

        b.HasIndex(e => e.Slug).IsUnique();

        b.HasMany(e => e.Installations)
         .WithOne(e => e.Connector!)
         .HasForeignKey(e => e.ConnectorId)
         .OnDelete(DeleteBehavior.Cascade);

        b.HasData(
            Connector.Create(DiscordId,  "discord",  "Discord",  "Route guild messages to your AI character in real-time.", "Chat",   "/icons/connectors/discord.svg",  true,  1),
            Connector.Create(TwitchId,   "twitch",   "Twitch",   "Let your character react to live chat and stream events.", "Stream", "/icons/connectors/twitch.svg",   true,  2),
            Connector.Create(TelegramId, "telegram", "Telegram", "Connect a Telegram bot to relay chat messages to your AI.", "Chat",  "/icons/connectors/telegram.svg", true,  3),
            Connector.Create(YouTubeId,  "youtube",  "YouTube",  "Connect live stream chat to drive AI responses.",         "Stream", "/icons/connectors/youtube.svg",  false, 4),
            Connector.Create(TikTokId,   "tiktok",   "TikTok",   "Engage your TikTok live audience with AI replies.",       "Stream", "/icons/connectors/tiktok.svg",   false, 5)
        );
    }
}
