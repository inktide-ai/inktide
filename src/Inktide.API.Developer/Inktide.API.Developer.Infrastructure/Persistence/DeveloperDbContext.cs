using Inktide.API.Developer.Domain.Entities;
using Inktide.API.Developer.Infrastructure.Persistence.Configurations;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Developer.Infrastructure.Persistence;

public sealed class DeveloperDbContext(DbContextOptions<DeveloperDbContext> options) : DbContext(options)
{
    public DbSet<DeveloperApplication> Applications => Set<DeveloperApplication>();
    public DbSet<WebhookDelivery> WebhookDeliveries => Set<WebhookDelivery>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new DeveloperApplicationConfiguration());
        modelBuilder.ApplyConfiguration(new WebhookDeliveryConfiguration());

        modelBuilder.AddInboxStateEntity();
        modelBuilder.AddOutboxMessageEntity();
        modelBuilder.AddOutboxStateEntity();
    }
}
