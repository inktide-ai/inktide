using Inktide.API.Developer.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Developer.Infrastructure.Persistence.Configurations;

public sealed class WebhookDeliveryConfiguration : IEntityTypeConfiguration<WebhookDelivery>
{
    public void Configure(EntityTypeBuilder<WebhookDelivery> b)
    {
        b.ToTable("webhook_deliveries", "developer");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.ApplicationId).HasColumnName("application_id");
        b.Property(e => e.EventType).HasColumnName("event_type").IsRequired().HasMaxLength(64);
        b.Property(e => e.PayloadJson).HasColumnName("payload_json").HasColumnType("jsonb");
        b.Property(e => e.StatusCode).HasColumnName("status_code");
        b.Property(e => e.ResponseBody).HasColumnName("response_body");
        b.Property(e => e.Attempt).HasColumnName("attempt");
        b.Property(e => e.DeliveredAt).HasColumnName("delivered_at");
        b.Property(e => e.NextRetryAt).HasColumnName("next_retry_at");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");

        b.HasOne(e => e.Application)
            .WithMany(a => a.Deliveries)
            .HasForeignKey(e => e.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(e => e.ApplicationId);
        b.HasIndex(e => e.NextRetryAt);
    }
}
