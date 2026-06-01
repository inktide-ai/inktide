using Inktide.API.Soul.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Soul.Infrastructure.Configurations;

public sealed class SoulActivityFeedEventConfiguration : IEntityTypeConfiguration<SoulActivityFeedEvent>
{
    public void Configure(EntityTypeBuilder<SoulActivityFeedEvent> b)
    {
        b.ToTable("soul_activity_feed", "soul");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.AiCardId).HasColumnName("ai_card_id").IsRequired();
        b.Property(e => e.EventType).HasColumnName("event_type").IsRequired().HasMaxLength(50);
        b.Property(e => e.Visibility).HasColumnName("visibility").IsRequired().HasMaxLength(20).HasDefaultValue("PUBLIC");
        b.Property(e => e.RenderedCopy).HasColumnName("rendered_copy").IsRequired();
        b.Property(e => e.Emoji).HasColumnName("emoji").IsRequired().HasMaxLength(8);
        b.Property(e => e.MetadataJson).HasColumnName("metadata").HasColumnType("jsonb");
        b.Property(e => e.OccurredAt).HasColumnName("occurred_at").IsRequired();

        b.HasIndex(e => new { e.AiCardId, e.Visibility, e.OccurredAt })
            .HasDatabaseName("idx_saf_card_visibility_time")
            .IsDescending(false, false, true);

        b.HasIndex(e => new { e.AiCardId, e.EventType, e.OccurredAt })
            .HasDatabaseName("idx_saf_card_type_time")
            .IsDescending(false, false, true);

        b.HasOne<AiCard>()
            .WithMany()
            .HasForeignKey(e => e.AiCardId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
