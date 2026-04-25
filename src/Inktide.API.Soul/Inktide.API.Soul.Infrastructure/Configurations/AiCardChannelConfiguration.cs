using Inktide.API.Soul.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Soul.Infrastructure.Configurations;

public sealed class AiCardChannelConfiguration : IEntityTypeConfiguration<AiCardChannel>
{

    public void Configure(EntityTypeBuilder<AiCardChannel> b)
    {
        b.ToTable("ai_card_channels", "soul");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id)
            .HasColumnName("id");

        b.Property(e => e.AiCardId)
            .HasColumnName("ai_card_id")
            .IsRequired();

        b.Property(e => e.Platform)
            .HasColumnName("platform")
            .IsRequired()
            .HasDefaultValue("twitch");

        b.Property(e => e.ChannelName)
            .HasColumnName("channel_name")
            .IsRequired();

        b.Property(e => e.ChannelId)
            .HasColumnName("channel_id");

        b.Property(e => e.BotUsername)
            .HasColumnName("bot_username")
            .IsRequired();

        b.Property(e => e.OAuthTokenEnc)
            .HasColumnName("oauth_token_enc");

        b.Property(e => e.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        b.Property(e => e.ConnectedAt)
            .HasColumnName("connected_at");

        b.Property(e => e.CreatedAt)
            .HasColumnName("created_at");

        b.HasIndex(e => e.AiCardId)
            .HasDatabaseName("idx_ai_card_channels_card");

        b.HasIndex(e => new { e.AiCardId, e.Platform, e.ChannelName })
            .IsUnique();

        b.HasIndex(e => new { e.Platform, e.IsActive })
            .HasDatabaseName("idx_ai_card_channels_active")
            .HasFilter("is_active = true");
    }

}
