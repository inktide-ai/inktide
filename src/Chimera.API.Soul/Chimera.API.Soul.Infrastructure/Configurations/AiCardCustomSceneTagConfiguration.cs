using Chimera.API.Soul.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chimera.API.Soul.Infrastructure.Configurations;

public sealed class AiCardCustomSceneTagConfiguration : IEntityTypeConfiguration<AiCardCustomSceneTag>
{

    public void Configure(EntityTypeBuilder<AiCardCustomSceneTag> b)
    {
        b.ToTable("ai_card_custom_scene_tags", "soul");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id)
            .HasColumnName("id");

        b.Property(e => e.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        b.Property(e => e.AiCardId)
            .HasColumnName("ai_card_id")
            .IsRequired();

        b.Property(e => e.Label)
            .HasColumnName("label")
            .HasMaxLength(128)
            .IsRequired();

        b.Property(e => e.LabelNormalized)
            .HasColumnName("label_normalized")
            .HasMaxLength(128)
            .IsRequired();

        b.Property(e => e.Color)
            .HasColumnName("color")
            .HasMaxLength(7);

        b.Property(e => e.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        b.HasIndex(e => new { e.AiCardId, e.LabelNormalized })
            .IsUnique()
            .HasDatabaseName("idx_ai_card_custom_scene_tags_card_label_norm");

        b.HasIndex(e => e.AiCardId)
            .HasDatabaseName("idx_ai_card_custom_scene_tags_card");

        b.HasOne(e => e.AiCard)
            .WithMany()
            .HasForeignKey(e => e.AiCardId)
            .OnDelete(DeleteBehavior.Cascade);
    }

}
