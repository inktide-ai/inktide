using Inktide.API.Developer.Domain.Entities;
using Inktide.API.Developer.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Developer.Infrastructure.Persistence.Configurations;

public sealed class DeveloperApplicationConfiguration : IEntityTypeConfiguration<DeveloperApplication>
{
    public void Configure(EntityTypeBuilder<DeveloperApplication> b)
    {
        b.ToTable("applications", "developer");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.OwnerUserId).HasColumnName("owner_user_id").IsRequired().HasMaxLength(128);
        b.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(128);
        b.Property(e => e.Description).HasColumnName("description");
        b.Property(e => e.IconUrl).HasColumnName("icon_url").HasMaxLength(512);
        b.Property(e => e.KeycloakClientId).HasColumnName("keycloak_client_id").IsRequired().HasMaxLength(256);
        b.Property(e => e.ClientSecretHash).HasColumnName("client_secret_hash").IsRequired().HasMaxLength(64);
        b.Property(e => e.RedirectUris).HasColumnName("redirect_uris").HasColumnType("text[]");
        b.Property(e => e.WebhookUrl).HasColumnName("webhook_url").HasMaxLength(512);
        b.Property(e => e.WebhookSecretHash).HasColumnName("webhook_secret_hash").HasMaxLength(64);
        b.Property(e => e.Status)
            .HasColumnName("status")
            .IsRequired()
            .HasMaxLength(32)
            .HasConversion(v => v.ToString().ToLowerInvariant(), v => Enum.Parse<ApplicationStatus>(v, ignoreCase: true));
        b.Property(e => e.ConnectorSlug).HasColumnName("connector_slug").HasMaxLength(64);
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");

        b.Property(e => e.Scopes)
            .HasColumnName("scopes")
            .HasColumnType("text[]")
            .HasConversion(
                v => v.Select(s => s.ToString().ToLowerInvariant()).ToArray(),
                v => v.Select(s => Enum.Parse<OAuthScope>(s, ignoreCase: true)).ToArray());

        b.HasIndex(e => e.KeycloakClientId).IsUnique();
        b.HasIndex(e => e.OwnerUserId);
    }
}
