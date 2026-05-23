using Inktide.API.Marketplace.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Marketplace.Infrastructure.Configurations;

public sealed class ConnectorInstallationConfiguration : IEntityTypeConfiguration<ConnectorInstallation>
{
    public void Configure(EntityTypeBuilder<ConnectorInstallation> b)
    {
        b.ToTable("connector_installations", "marketplace");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.SoulId).HasColumnName("soul_id").IsRequired();
        b.Property(e => e.ConnectorId).HasColumnName("connector_id").IsRequired();
        b.Property(e => e.InstalledAt).HasColumnName("installed_at").IsRequired();

        b.HasIndex(e => new { e.SoulId, e.ConnectorId }).IsUnique();

        b.HasOne(e => e.Connector)
         .WithMany(c => c.Installations)
         .HasForeignKey(e => e.ConnectorId)
         .OnDelete(DeleteBehavior.Cascade);
    }
}
