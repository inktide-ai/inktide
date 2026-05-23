using Inktide.API.Graph.Domain.Entities;
using Inktide.API.Graph.Infrastructure.Configurations;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Graph.Infrastructure.DbContext;

public sealed class GraphDbContext : Microsoft.EntityFrameworkCore.DbContext
{
    public GraphDbContext(DbContextOptions<GraphDbContext> options) : base(options) { }

    public DbSet<GraphDefinition> GraphDefinitions => Set<GraphDefinition>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new GraphDefinitionConfiguration());
        base.OnModelCreating(modelBuilder);
    }
}
