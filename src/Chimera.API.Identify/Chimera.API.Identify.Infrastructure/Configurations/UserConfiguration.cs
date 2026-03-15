using Chimera.API.Identify.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chimera.API.Identify.Infrastructure.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users", "gateway");
        
        builder.HasKey(e => e.Id);
        
        builder.Property(e => e.Id).HasColumnName("id");
        
        builder.Property(e => e.Email)
            .HasColumnName("email")
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(e => e.PasswordHash)
            .HasColumnName("password_hash")
            .IsRequired();
        
        builder.Property(e => e.DisplayName)
            .HasColumnName("display_name")
            .HasMaxLength(255);

        builder.Property(e => e.GoogleId)
            .HasColumnName("google_id")
            .HasMaxLength(128);

        builder.Property(e => e.TwitchId)
            .HasColumnName("twitch_id")
            .HasMaxLength(128);
        
        builder.Property(e => e.Role)
            .HasColumnName("role")
            .IsRequired()
            .HasMaxLength(50);
        
        builder
            .Property(e => e.IsActive)
            .HasColumnName("is_active");
        
        
        builder
            .Property(e => e.CreatedAt)
            .HasColumnName("created_at");
        
        builder
            .Property(e => e.UpdatedAt)
            .HasColumnName("updated_at");
        
        builder
            .HasIndex(e => e.Email)
            .IsUnique();

        builder
            .HasIndex(e => e.GoogleId)
            .IsUnique()
            .HasFilter("google_id IS NOT NULL");

        builder
            .HasIndex(e => e.TwitchId)
            .IsUnique()
            .HasFilter("twitch_id IS NOT NULL");
    }
     
}