using Microsoft.EntityFrameworkCore;
using Chimera.ApiGateway.Domain.Entities;

namespace Chimera.ApiGateway.Infrastructure.Persistence;

/// <summary>
/// Gateway database context.
/// </summary>
public sealed class GatewayDbContext : DbContext
{
    public GatewayDbContext(DbContextOptions<GatewayDbContext> options) : base(options)
    {
    }
    
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users", "gateway");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Email)
                .HasColumnName("email")
                .IsRequired()
                .HasMaxLength(255);
            entity.Property(e => e.PasswordHash)
                .HasColumnName("password_hash")
                .IsRequired()
                .HasMaxLength(255);
            entity.Property(e => e.DisplayName)
                .HasColumnName("display_name")
                .HasMaxLength(255);
            entity.Property(e => e.Role)
                .HasColumnName("role")
                .IsRequired()
                .HasMaxLength(50);
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.HasIndex(e => e.Email).IsUnique();
        });
    }
}
