using Inktide.API.Billing.Application.Models;
using Inktide.API.Billing.Infrastructure.Configurations;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Billing.Infrastructure.DbContext;

public sealed class BillingDbContext : Microsoft.EntityFrameworkCore.DbContext
{
    public BillingDbContext(DbContextOptions<BillingDbContext> options) : base(options) { }

    public DbSet<UserSubscription> UserSubscriptions => Set<UserSubscription>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new UserSubscriptionConfiguration());
        base.OnModelCreating(modelBuilder);
    }
}
