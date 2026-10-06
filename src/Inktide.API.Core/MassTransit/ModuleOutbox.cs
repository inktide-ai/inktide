using MassTransit;
using MassTransit.EntityFrameworkCoreIntegration;
using MassTransit.Middleware.Outbox;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Inktide.API.Core.MassTransit;

/// <summary>
/// Publishes into the transactional outbox of <typeparamref name="TDbContext"/>: the message is stored by that
/// context's next SaveChanges, in the same transaction as the module's own changes, and delivered after commit.
/// Modules inject this instead of <see cref="IPublishEndpoint"/>, which can point at only one module's DbContext
/// (see <see cref="ModuleOutboxRegistration.AddModuleOutbox{TDbContext}"/>).
/// </summary>
public interface IOutboxPublisher<TDbContext>
    where TDbContext : DbContext
{
    Task Publish<T>(T message, CancellationToken cancellationToken = default)
        where T : class;
}

internal sealed class OutboxPublisher<TDbContext>(EntityFrameworkScopedBusContextProvider<IBus, TDbContext> provider)
    : IOutboxPublisher<TDbContext>
    where TDbContext : DbContext
{
    public Task Publish<T>(T message, CancellationToken cancellationToken)
        where T : class =>
        provider.Context.PublishEndpoint.Publish(message, cancellationToken);
}

public static class ModuleOutboxRegistration
{
    /// <summary>
    /// Gives a module a transactional outbox on its own DbContext.
    /// <para>
    /// MassTransit supports one bus outbox per bus. UseBusOutbox binds the scoped <see cref="IPublishEndpoint"/>
    /// to a single DbContext (the last one registered wins), so messages other modules published were added to a
    /// context they never saved and silently lost. Every UseBusOutbox also adds a delivery service, and those
    /// services share one <see cref="IBusOutboxNotification"/>, whose WaitForDelivery throws a
    /// NullReferenceException when two of them wait at once.
    /// </para>
    /// <para>
    /// So the first module registers the bus outbox (its delivery service and notification) and every module
    /// publishes through <see cref="IOutboxPublisher{TDbContext}"/>, built on MassTransit's own
    /// <see cref="EntityFrameworkScopedBusContextProvider{TBus,TDbContext}"/> for its context. One delivery
    /// service is enough: all module contexts map the same outbox tables (see EfCore.MassTransitOutboxTables).
    /// </para>
    /// </summary>
    public static void AddModuleOutbox<TDbContext>(this IBusRegistrationConfigurator configurator)
        where TDbContext : DbContext
    {
        var busOutboxRegistered = configurator.Any(d => d.ServiceType == typeof(IBusOutboxNotification));

        configurator.AddEntityFrameworkOutbox<TDbContext>(o =>
        {
            o.UsePostgres();
            if (!busOutboxRegistered)
                o.UseBusOutbox();
        });

        configurator.AddScoped<EntityFrameworkScopedBusContextProvider<IBus, TDbContext>>();
        configurator.AddScoped<IOutboxPublisher<TDbContext>, OutboxPublisher<TDbContext>>();
    }
}
