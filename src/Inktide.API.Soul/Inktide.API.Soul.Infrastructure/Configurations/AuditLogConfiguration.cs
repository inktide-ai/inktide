using Inktide.API.Soul.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Soul.Infrastructure.Configurations;

public sealed class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{

    public void Configure(EntityTypeBuilder<AuditLog> b)
    {
        b.ToTable("audit_log", "soul");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id)
            .HasColumnName("id");

        b.Property(e => e.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        b.Property(e => e.EntityType)
            .HasColumnName("entity_type")
            .IsRequired();

        b.Property(e => e.EntityId)
            .HasColumnName("entity_id")
            .IsRequired();

        b.Property(e => e.Action)
            .HasColumnName("action")
            .IsRequired();

        b.Property(e => e.Changes)
            .HasColumnName("changes")
            .HasColumnType("jsonb");

        b.Property(e => e.IpAddress)
            .HasColumnName("ip_address");

        b.Property(e => e.CreatedAt)
            .HasColumnName("created_at");

        b.HasIndex(e => new { e.UserId, e.CreatedAt })
            .HasDatabaseName("idx_audit_user")
            .IsDescending(false, true);

        b.HasIndex(e => new { e.EntityType, e.EntityId, e.CreatedAt })
            .HasDatabaseName("idx_audit_entity")
            .IsDescending(false, false, true);
    }

}
