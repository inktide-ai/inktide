using Inktide.API.Memory.Domain.Models;
using Inktide.API.Memory.Infrastructure.Configurations;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Memory.Infrastructure.DbContext;

public sealed class MemoryDbContext : Microsoft.EntityFrameworkCore.DbContext
{
    public MemoryDbContext(DbContextOptions<MemoryDbContext> options) : base(options) { }

    public DbSet<MemoryMetadata> MemoryMetadata => Set<MemoryMetadata>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new MemoryMetadataConfiguration());
        base.OnModelCreating(modelBuilder);
    }
}
