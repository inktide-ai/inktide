using Inktide.API.Core.MassTransit;
using MassTransit;
using MassTransit.EntityFrameworkCoreIntegration;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Xunit;

namespace Inktide.API.Core.Tests.MassTransit;

public sealed class ModuleOutboxTests
{
    public sealed record SomethingHappened(Guid Id);

    // Two modules with their own DbContext, registered the way module startups do it.
    public sealed class FirstModuleDbContext(DbContextOptions<FirstModuleDbContext> options) : DbContext(options)
    {
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.AddInboxStateEntity();
            modelBuilder.AddOutboxMessageEntity();
            modelBuilder.AddOutboxStateEntity();
        }
    }

    public sealed class SecondModuleDbContext(DbContextOptions<SecondModuleDbContext> options) : DbContext(options)
    {
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.AddInboxStateEntity();
            modelBuilder.AddOutboxMessageEntity();
            modelBuilder.AddOutboxStateEntity();
        }
    }

    private static ServiceProvider BuildProvider()
    {
        var databaseName = Guid.NewGuid().ToString();
        var services = new ServiceCollection();
        services.AddDbContext<FirstModuleDbContext>(o => o.UseInMemoryDatabase(databaseName + "-first"));
        services.AddDbContext<SecondModuleDbContext>(o => o.UseInMemoryDatabase(databaseName + "-second"));
        services.AddMassTransitTestHarness(x =>
        {
            x.AddModuleOutbox<FirstModuleDbContext>();
            x.AddModuleOutbox<SecondModuleDbContext>();
        });
        return services.BuildServiceProvider(validateScopes: true);
    }

    // With UseBusOutbox on both contexts the scoped IPublishEndpoint wrote into the last one registered,
    // so a module that published and saved its own context lost the message.
    [Fact]
    public async Task Each_module_publishes_into_its_own_DbContext()
    {
        await using var provider = BuildProvider();
        await using var scope = provider.CreateAsyncScope();

        var first = scope.ServiceProvider.GetRequiredService<FirstModuleDbContext>();
        var second = scope.ServiceProvider.GetRequiredService<SecondModuleDbContext>();

        await scope.ServiceProvider.GetRequiredService<IOutboxPublisher<FirstModuleDbContext>>()
            .Publish(new SomethingHappened(Guid.NewGuid()));
        await first.SaveChangesAsync();

        Assert.Equal(1, await first.Set<OutboxMessage>().CountAsync());
        Assert.Equal(0, await second.Set<OutboxMessage>().CountAsync());

        await scope.ServiceProvider.GetRequiredService<IOutboxPublisher<SecondModuleDbContext>>()
            .Publish(new SomethingHappened(Guid.NewGuid()));
        await second.SaveChangesAsync();

        Assert.Equal(1, await first.Set<OutboxMessage>().CountAsync());
        Assert.Equal(1, await second.Set<OutboxMessage>().CountAsync());
    }

    // Every UseBusOutbox added a delivery service, and they all waited on one shared BusOutboxNotification:
    // its WaitForDelivery threw NullReferenceException whenever two of them waited at once.
    [Fact]
    public async Task Only_one_outbox_delivery_service_runs_for_all_modules()
    {
        await using var provider = BuildProvider();

        var deliveryServices = provider.GetServices<IHostedService>()
            .Count(s => s.GetType().IsGenericType
                && s.GetType().GetGenericTypeDefinition() == typeof(BusOutboxDeliveryService<>));

        Assert.Equal(1, deliveryServices);
    }
}
