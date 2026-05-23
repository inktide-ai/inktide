using Inktide.API.Marketplace.Domain.Entities;
using Inktide.API.Marketplace.Infrastructure.Configurations;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Marketplace.Infrastructure.DbContext;

public sealed class MarketplaceDbContext : Microsoft.EntityFrameworkCore.DbContext
{
    public MarketplaceDbContext(DbContextOptions<MarketplaceDbContext> options) : base(options) { }

    public DbSet<Connector>             Connectors             => Set<Connector>();
    public DbSet<ConnectorInstallation> ConnectorInstallations => Set<ConnectorInstallation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new ConnectorConfiguration());
        modelBuilder.ApplyConfiguration(new ConnectorInstallationConfiguration());
        base.OnModelCreating(modelBuilder);
    }
}
