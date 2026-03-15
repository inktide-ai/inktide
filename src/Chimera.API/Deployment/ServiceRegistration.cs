using Chimera.API.Core;
using DryIoc;
using Microsoft.Extensions.Logging;

namespace Chimera.API.Deployment;

/// <summary>
/// DryIoc composition root: registers application services, loggers, and discovers <see cref="IServiceRegistrator"/> implementations.
/// </summary>
/// <remarks>
/// Uses ILoggerFactory from MS DI (registered by the host) to resolve ILogger&lt;T&gt; via LoggerFactoryExtensions.CreateLogger.
/// </remarks>
public sealed class ServicesRegistration
{
    public ServicesRegistration(IRegistrator registrator)
    {
        var createLoggerGeneric = typeof(LoggerFactoryExtensions).GetMethod(
            nameof(LoggerFactoryExtensions.CreateLogger),
            1,
            [typeof(ILoggerFactory)]);

        registrator.Register(
            typeof(ILogger<>),
            Reuse.Transient,
            Made.Of(req => FactoryMethod.Of(createLoggerGeneric!.MakeGenericMethod(req.ServiceType.GenericTypeArguments[0]))),
            Setup.Default);

        registrator.RegisterDelegate<ILogger>(resolver =>
            resolver.Resolve<ILoggerFactory>().CreateLogger("Default"));

        registrator.Register<App>(Reuse.Singleton);

        var registratorTypes = AppDomain.CurrentDomain.GetAssemblies()
            .Distinct()
            .SelectMany(a => a.DefinedTypes)
            .Where(t => t is { IsClass: true, IsAbstract: false }
                       && t.ImplementsServiceType<IServiceRegistrator>())
            .Cast<Type>()
            .ToList();

        if (registratorTypes.Count > 0)
        {
            registrator.RegisterMany(
                registratorTypes,
                type => type.ImplementsServiceType<IServiceRegistrator>() ? type.GetInterfaces() : null,
                type => ReflectionFactory.Of(type, Reuse.Singleton, Made.Of(), Setup.Default));
        }
        
    }
}