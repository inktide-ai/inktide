using Inktide.API.Soul.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Soul.Infrastructure.Configurations;

public sealed class UserProviderCredentialConfiguration : IEntityTypeConfiguration<UserProviderCredential>
{

    public void Configure(EntityTypeBuilder<UserProviderCredential> b)
    {
        b.ToTable("user_provider_credentials", "soul");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id)
            .HasColumnName("id");

        b.Property(e => e.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        b.Property(e => e.ProviderId)
            .HasColumnName("provider_id")
            .IsRequired()
            .HasMaxLength(64);

        b.Property(e => e.ApiKeyEnc)
            .HasColumnName("api_key_enc")
            .HasColumnType("text");

        b.Property(e => e.BaseUrl)
            .HasColumnName("base_url")
            .HasColumnType("text");

        b.Property(e => e.Config)
            .HasColumnName("config")
            .HasColumnType("text");

        b.Property(e => e.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        b.Property(e => e.CreatedAt)
            .HasColumnName("created_at");

        b.Property(e => e.UpdatedAt)
            .HasColumnName("updated_at");

        b.HasIndex(e => new { e.UserId, e.ProviderId })
            .IsUnique()
            .HasDatabaseName("idx_user_provider_credentials_user_provider");

        b.HasIndex(e => e.UserId)
            .HasDatabaseName("idx_user_provider_credentials_user");
    }

}
