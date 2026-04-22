using Chimera.API.Soul.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chimera.API.Soul.Infrastructure.Configurations;

public sealed class AiCardModelConfiguration : IEntityTypeConfiguration<AiCardModel>
{

    public void Configure(EntityTypeBuilder<AiCardModel> b)
    {
        b.ToTable("ai_card_models", "soul");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id)
            .HasColumnName("id");

        b.Property(e => e.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        b.Property(e => e.AiCardId)
            .HasColumnName("ai_card_id")
            .IsRequired();

        b.Property(e => e.StorageKey)
            .HasColumnName("storage_key")
            .IsRequired();

        b.Property(e => e.PublicUrl)
            .HasColumnName("public_url")
            .IsRequired();

        b.Property(e => e.OriginalFileName)
            .HasColumnName("original_file_name")
            .IsRequired();

        b.Property(e => e.ContentType)
            .HasColumnName("content_type")
            .IsRequired();

        b.Property(e => e.SizeBytes)
            .HasColumnName("size_bytes")
            .IsRequired();

        b.Property(e => e.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        b.HasIndex(e => e.StorageKey)
            .IsUnique()
            .HasDatabaseName("idx_ai_card_models_storage_key");

        b.HasIndex(e => e.AiCardId)
            .HasDatabaseName("idx_ai_card_models_card");

        b.HasIndex(e => new { e.UserId, e.AiCardId })
            .HasDatabaseName("idx_ai_card_models_user_card");

        b.HasOne(e => e.AiCard)
            .WithMany()
            .HasForeignKey(e => e.AiCardId)
            .OnDelete(DeleteBehavior.Cascade);
    }

}
