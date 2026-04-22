using Chimera.API.Soul.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chimera.API.Soul.Infrastructure.Configurations;

public sealed class MemoryMetadataConfiguration : IEntityTypeConfiguration<MemoryMetadata>
{

    public void Configure(EntityTypeBuilder<MemoryMetadata> b)
    {
        b.ToTable("memory_metadata", "soul");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id)
            .HasColumnName("id");

        b.Property(e => e.AiCardId)
            .HasColumnName("ai_card_id")
            .IsRequired();

        b.Property(e => e.QdrantPointId)
            .HasColumnName("qdrant_point_id")
            .IsRequired();

        b.Property(e => e.FactText)
            .HasColumnName("fact_text")
            .IsRequired();

        b.Property(e => e.Category)
            .HasColumnName("category")
            .IsRequired()
            .HasDefaultValue("general");

        b.Property(e => e.SourceType)
            .HasColumnName("source_type")
            .IsRequired()
            .HasDefaultValue("chat");

        b.Property(e => e.Importance)
            .HasColumnName("importance")
            .HasDefaultValue(0.5);

        b.Property(e => e.RememberedAt)
            .HasColumnName("remembered_at");

        b.Property(e => e.LastRecalledAt)
            .HasColumnName("last_recalled_at");

        b.Property(e => e.RecallCount)
            .HasColumnName("recall_count")
            .HasDefaultValue(0);

        b.Property(e => e.ExpiresAt)
            .HasColumnName("expires_at");

        b.HasIndex(e => e.AiCardId)
            .HasDatabaseName("idx_memory_card");

        b.HasIndex(e => new { e.AiCardId, e.QdrantPointId })
            .IsUnique();

        b.HasIndex(e => new { e.AiCardId, e.Importance })
            .HasDatabaseName("idx_memory_importance")
            .IsDescending(false, true);

        b.HasIndex(e => new { e.AiCardId, e.Category })
            .HasDatabaseName("idx_memory_category");

        b.HasIndex(e => e.ExpiresAt)
            .HasDatabaseName("idx_memory_expiry")
            .HasFilter("expires_at IS NOT NULL");

        b.HasOne(e => e.AiCard)
            .WithMany()
            .HasForeignKey(e => e.AiCardId)
            .OnDelete(DeleteBehavior.Cascade);
    }

}
