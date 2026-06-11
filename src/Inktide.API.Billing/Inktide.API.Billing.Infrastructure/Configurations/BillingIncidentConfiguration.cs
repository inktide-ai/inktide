using Inktide.API.Billing.Application.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Billing.Infrastructure.Configurations;

public sealed class BillingIncidentConfiguration : IEntityTypeConfiguration<BillingIncident>
{
    public void Configure(EntityTypeBuilder<BillingIncident> b)
    {
        b.ToTable("billing_incidents", "billing");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id).HasColumnName("id");

        b.Property(e => e.Provider)
            .HasColumnName("provider")
            .HasMaxLength(32)
            .IsRequired();

        b.Property(e => e.EventId)
            .HasColumnName("event_id")
            .HasMaxLength(128)
            .IsRequired();

        b.Property(e => e.EventType)
            .HasColumnName("event_type")
            .HasMaxLength(64)
            .IsRequired();

        b.Property(e => e.Reason)
            .HasColumnName("reason")
            .HasMaxLength(64)
            .IsRequired();

        b.Property(e => e.RawPayload)
            .HasColumnName("raw_payload")
            .IsRequired();

        b.Property(e => e.OccurredAt).HasColumnName("occurred_at");

        b.HasIndex(e => e.OccurredAt).HasDatabaseName("idx_billing_incidents_occurred_at");
    }
}
