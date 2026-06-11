using Inktide.API.Organization.Application.Entities;
using Inktide.API.Organization.Application.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Inktide.API.Organization.Infrastructure.Configurations;

public sealed class OrganizationMemberConfiguration : IEntityTypeConfiguration<OrganizationMember>
{
    public void Configure(EntityTypeBuilder<OrganizationMember> b)
    {
        b.ToTable("organization_members", "organization");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.OrganizationId).HasColumnName("organization_id");
        b.Property(e => e.UserId).HasColumnName("user_id").HasMaxLength(64).IsRequired();
        b.Property(e => e.Role)
            .HasColumnName("role")
            .HasConversion(new EnumToStringConverter<OrganizationRole>())
            .HasMaxLength(16)
            .IsRequired();
        b.Property(e => e.JoinedAt).HasColumnName("joined_at");
        b.HasOne(e => e.Organization)
            .WithMany()
            .HasForeignKey(e => e.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);
        b.HasIndex(e => new { e.OrganizationId, e.UserId })
            .HasDatabaseName("idx_org_member_org_user")
            .IsUnique();
        b.HasIndex(e => e.UserId)
            .HasDatabaseName("idx_org_member_user_id");
    }
}
