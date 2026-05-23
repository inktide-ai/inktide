using Inktide.API.Soul.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Soul.Infrastructure.Configurations;

public sealed class LlmCatalogConfiguration : IEntityTypeConfiguration<LlmCatalogEntry>
{

    public void Configure(EntityTypeBuilder<LlmCatalogEntry> b)
    {
        b.ToTable("llm_catalog", "soul");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id)
            .HasColumnName("id");

        b.Property(e => e.Provider)
            .HasColumnName("provider")
            .IsRequired();

        b.Property(e => e.ModelId)
            .HasColumnName("model_id")
            .IsRequired();

        b.Property(e => e.DisplayName)
            .HasColumnName("display_name")
            .IsRequired();

        b.Property(e => e.Tier)
            .HasColumnName("tier")
            .IsRequired()
            .HasDefaultValue("free");

        b.Property(e => e.IsAvailable)
            .HasColumnName("is_available")
            .HasDefaultValue(true);

        b.Property(e => e.RequiresApiKey)
            .HasColumnName("requires_api_key")
            .HasDefaultValue(true);

        b.Property(e => e.CreatedAt)
            .HasColumnName("created_at");

        b.HasIndex(e => new { e.Provider, e.ModelId })
            .IsUnique();
    }

}
