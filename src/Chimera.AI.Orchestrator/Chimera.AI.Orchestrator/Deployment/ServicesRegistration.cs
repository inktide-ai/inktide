using System.Reflection;
using DryIoc;
using Microsoft.Extensions.Logging;
using Chimera.AI.Orchestrator.Core;

namespace Chimera.AI.Orchestrator.Deployment;

/// <summary>
/// DryIoc composition root: registers loggers, App, and discovers <see cref="IServiceRegistrator"/> implementations.
/// </summary>
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
