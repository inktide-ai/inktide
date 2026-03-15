using Chimera.API.Identify.Domain.Entities;
using Chimera.API.Identify.Infrastructure.Configurations;
using Microsoft.EntityFrameworkCore;

namespace Chimera.API.Identify.Infrastructure.DbContext;

/// <summary>
/// Gateway database context.
/// </summary>
public sealed class IdentifyDbContext : Microsoft.EntityFrameworkCore.DbContext
{
    public IdentifyDbContext(DbContextOptions<IdentifyDbContext> options) : base(options)
    {
    }
    
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        
        modelBuilder.ApplyConfiguration(new UserConfiguration());
        
        base.OnModelCreating(modelBuilder);
        
    }
}
