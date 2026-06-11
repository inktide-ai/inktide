using Inktide.API.Billing.Application.Models;
using Inktide.API.Billing.Infrastructure.Configurations;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Billing.Infrastructure.DbContext;

public sealed class BillingDbContext : Microsoft.EntityFrameworkCore.DbContext
{
    public BillingDbContext(DbContextOptions<BillingDbContext> options) : base(options) { }

    public DbSet<UserSubscription> UserSubscriptions => Set<UserSubscription>();
    public DbSet<BillingIncident> BillingIncidents => Set<BillingIncident>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new UserSubscriptionConfiguration());
        modelBuilder.ApplyConfiguration(new BillingIncidentConfiguration());
        modelBuilder.AddInboxStateEntity();
        modelBuilder.AddOutboxMessageEntity();
        modelBuilder.AddOutboxStateEntity();
        base.OnModelCreating(modelBuilder);
    }
}
