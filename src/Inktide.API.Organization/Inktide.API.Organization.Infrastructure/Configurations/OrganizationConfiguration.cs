using Inktide.API.Organization.Application.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Organization.Infrastructure.Configurations;

public sealed class OrganizationConfiguration : IEntityTypeConfiguration<Application.Entities.Organization>
{
    public void Configure(EntityTypeBuilder<Application.Entities.Organization> b)
    {
        b.ToTable("organizations", "organization");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.Name).HasColumnName("name").HasMaxLength(256).IsRequired();
        b.Property(e => e.OwnerId).HasColumnName("owner_id").HasMaxLength(64).IsRequired();
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.HasIndex(e => e.OwnerId).HasDatabaseName("idx_org_owner_id").IsUnique();
    }
}
