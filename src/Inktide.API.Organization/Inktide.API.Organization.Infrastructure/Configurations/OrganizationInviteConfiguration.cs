using Inktide.API.Organization.Application.Entities;
using Inktide.API.Organization.Application.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Inktide.API.Organization.Infrastructure.Configurations;

public sealed class OrganizationInviteConfiguration : IEntityTypeConfiguration<OrganizationInvite>
{
    public void Configure(EntityTypeBuilder<OrganizationInvite> b)
    {
        b.ToTable("organization_invites", "organization");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.OrganizationId).HasColumnName("organization_id");
        b.Property(e => e.Email).HasColumnName("email").HasMaxLength(256).IsRequired();
        b.Property(e => e.Role)
            .HasColumnName("role")
            .HasConversion(new EnumToStringConverter<OrganizationRole>())
            .HasMaxLength(16)
            .IsRequired();
        b.Property(e => e.Token).HasColumnName("token").HasMaxLength(128).IsRequired();
        b.Property(e => e.InvitedBy).HasColumnName("invited_by").HasMaxLength(64).IsRequired();
        b.Property(e => e.Status)
            .HasColumnName("status")
            .HasConversion(new EnumToStringConverter<InviteStatus>())
            .HasMaxLength(16)
            .IsRequired();
        b.Property(e => e.ExpiresAt).HasColumnName("expires_at");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.HasOne(e => e.Organization)
            .WithMany()
            .HasForeignKey(e => e.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);
        b.HasIndex(e => e.Token).HasDatabaseName("idx_org_invite_token").IsUnique();
        b.HasIndex(e => new { e.OrganizationId, e.Email, e.Status })
            .HasDatabaseName("idx_org_invite_org_email_status");
    }
}
