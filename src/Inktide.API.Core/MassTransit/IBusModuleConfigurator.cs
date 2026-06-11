using MassTransit;

namespace Inktide.API.Core.MassTransit;

/// <summary>
/// Implemented by module startups that need to register MassTransit consumers, outboxes, or custom endpoints.
/// The host collects all implementations and calls them inside a single AddMassTransit registration,
/// ensuring there is exactly one bus in the process.
/// </summary>
public interface IBusModuleConfigurator
{
    /// <summary>Registers consumers, sagas, and EF outboxes into the bus registration configurator.</summary>
    void ConfigureConsumers(IBusRegistrationConfigurator x);

    /// <summary>
    /// Configures receive endpoints (queue names, retry policies, consumer wiring).
    /// Called inside UsingRabbitMq after all consumer registrations are complete.
    /// Default implementation is a no-op — override only when explicit endpoint config is required.
    /// </summary>
    void ConfigureEndpoints(
        IReceiveConfigurator<IReceiveEndpointConfigurator> cfg,
        IBusRegistrationContext context) { }
}
