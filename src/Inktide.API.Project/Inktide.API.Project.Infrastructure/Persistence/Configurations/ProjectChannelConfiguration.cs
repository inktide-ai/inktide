using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inktide.API.Project.Domain.Entities;
namespace Inktide.API.Project.Infrastructure.Persistence.Configurations;

public sealed class ProjectChannelConfiguration : IEntityTypeConfiguration<ProjectChannel>
{
    public void Configure(EntityTypeBuilder<ProjectChannel> b)
    {
        b.ToTable("project_channels", "project");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.ProjectId).HasColumnName("project_id").IsRequired();
        b.Property(x => x.Platform).HasColumnName("platform").IsRequired().HasDefaultValue("twitch");
        b.Property(x => x.ChannelName).HasColumnName("channel_name").IsRequired();
        b.Property(x => x.ChannelId).HasColumnName("channel_id");
        b.Property(x => x.BotUsername).HasColumnName("bot_username").IsRequired().HasDefaultValue("");
        b.Property(x => x.OAuthTokenEnc).HasColumnName("oauth_token_enc");
        b.Property(x => x.RefreshTokenEnc).HasColumnName("refresh_token_enc");
        b.Property(x => x.CustomBotTokenEnc).HasColumnName("custom_bot_token_enc");
        b.Property(x => x.TokenExpiresAt).HasColumnName("token_expires_at");
        b.Property(x => x.IsActive).HasColumnName("is_active").HasDefaultValue(true);
        b.Property(x => x.ConnectedAt).HasColumnName("connected_at");
        b.Property(x => x.CreatedAt).HasColumnName("created_at");
        b.HasOne(x => x.Project).WithMany().HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Cascade);
        b.HasIndex(x => x.ProjectId).HasDatabaseName("idx_project_channels_project_id");
        b.HasIndex(new[] { "ProjectId", "Platform", "ChannelName" })
            .IsUnique()
            .HasFilter("project_id IS NOT NULL")
            .HasDatabaseName("IX_project_channels_project_id_platform_channel_name");
    }
}
