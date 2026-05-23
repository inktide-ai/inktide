using Inktide.API.Soul.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Soul.Infrastructure.Configurations;

public sealed class OutboxEventConfiguration : IEntityTypeConfiguration<OutboxEvent>
{
    public void Configure(EntityTypeBuilder<OutboxEvent> b)
    {
        b.ToTable("outbox_events", "soul");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.EventType).HasColumnName("event_type").IsRequired().HasMaxLength(100);
        b.Property(e => e.Payload).HasColumnName("payload").IsRequired();
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.ProcessedAt).HasColumnName("processed_at");
        b.Property(e => e.Error).HasColumnName("error");

        b.HasIndex(e => e.ProcessedAt)
            .HasDatabaseName("idx_outbox_unprocessed")
            .HasFilter("processed_at IS NULL");
    }
}
