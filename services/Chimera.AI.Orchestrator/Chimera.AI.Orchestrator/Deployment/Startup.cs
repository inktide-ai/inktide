using System.Reflection;
using DryIoc;
using DryIoc.Microsoft.DependencyInjection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;
using Chimera.AI.Orchestrator.Core;
using Chimera.AI.Orchestrator.Settings;

namespace Chimera.AI.Orchestrator.Deployment;

/// <summary>
/// Configures the application host and web pipeline.
/// </summary>
public static class Startup
{
    public static IHostBuilder CreateHostBuilder(
        string? rootPath = null,
        Action<HostBuilderContext, IServiceCollection>? additionalConfigureServices = null)
    {
        rootPath ??= Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location)!;
        Directory.SetCurrentDirectory(rootPath);

        Dictionary<string, ModuleInfo>? modules = null;

        return new HostBuilder()
            .UseSerilog()
            .ConfigureWebHostDefaults(webHostBuilder =>
            {
                webHostBuilder
                    .ConfigureAppConfiguration((context, configurationBuilder) =>
                    {
                        configurationBuilder
                            .SetBasePath(rootPath)
                            .AddJsonFile("appsettings.json", false, true)
                            .AddJsonFile($"appsettings.{context.HostingEnvironment.EnvironmentName}.json", true, true)
                            .AddJsonFile($"appsettings.{context.HostingEnvironment.EnvironmentName}.User.json", true, true);

                        configurationBuilder.AddEnvironmentVariables();

                        var config = configurationBuilder.Build();
                        modules = new Dictionary<string, ModuleInfo>();
                        config.Bind("Modules", modules);

                        var basePath = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location) ?? rootPath;

                        foreach (var kvp in modules.Where(m => m.Value.Enabled))
                        {
                            Log.Logger?.Information("Adding module \"{ModuleKey}\" from assembly \"{Assembly}\"",
                                kvp.Key, kvp.Value.AssemblyName);
                            var assemblyPath = Path.IsPathRooted(kvp.Value.AssemblyName)
                                ? kvp.Value.AssemblyName
                                : Path.Combine(basePath, kvp.Value.AssemblyName);
                            Assembly.LoadFrom(assemblyPath);
                        }

                        var webHostConfigurators = AppDomain.CurrentDomain.GetAssemblies()
                            .Distinct()
                            .SelectMany(a => a.DefinedTypes)
                            .Where(t => t.ImplementsServiceType<IWebHostConfigurator>())
                            .Select(t => (IWebHostConfigurator)Activator.CreateInstance(t)!)
                            .ToList();

                        foreach (var configurator in webHostConfigurators)
                        {
                            configurator.Configure(webHostBuilder);
                        }
                    })
                    .Configure((_, applicationBuilder) =>
                    {
                        var applicationConfigurators = AppDomain.CurrentDomain.GetAssemblies()
                            .Distinct()
                            .SelectMany(a => a.DefinedTypes)
                            .Where(t => t.ImplementsServiceType<IApplicationConfigurator>())
                            .Select(t => (IApplicationConfigurator)Activator.CreateInstance(t)!)
                            .OrderBy(c => c.GetType().Name)
                            .ToList();

                        foreach (var configurator in applicationConfigurators)
                        {
                            configurator.Configure(applicationBuilder);
                        }
                    });
            })
            .ConfigureHostConfiguration(builder => builder.AddEnvironmentVariables())
            .UseServiceProviderFactory(ctx =>
                new DryIocServiceProviderFactory(ctx.Properties["DryIocContainer"] as IContainer))
            .ConfigureServices((ctx, services) =>
            {
                ConfigureServices(ctx, services);
                additionalConfigureServices?.Invoke(ctx, services);

                var container = new Container();
                container.RegisterInstance(modules ?? new Dictionary<string, ModuleInfo>());
                container.RegisterInstance(ctx.Configuration);
                container
                    .WithCompositionRoot<ServicesRegistration>()
                    .WithCompositionRoot<ServiceRegistratorsCompositionRoot>();

                var startups = AppDomain.CurrentDomain.GetAssemblies()
                    .Distinct()
                    .SelectMany(a => a.DefinedTypes)
                    .Where(t => t is { IsClass: true, IsAbstract: false } && t.ImplementsServiceType<Core.IStartup>())
                    .Select(t => (Core.IStartup)Activator.CreateInstance(t)!)
                    .ToList();
                foreach (var startup in startups)
                {
                    startup.ConfigureServices(ctx, services);
                }

                ctx.Properties["DryIocContainer"] = container;
            });
    }

    private static void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        CatchUnhandledExceptions();

        services
            .AddOptions()
            .Configure<Dictionary<string, ModuleInfo>>(ctx.Configuration.GetSection("Modules"));
    }

    private static void CatchUnhandledExceptions()
    {
        AppDomain.CurrentDomain.UnhandledException += (_, e) =>
        {
            Log.Logger?.Fatal("Unhandled exception occurred: {Message}",
                (e.ExceptionObject as Exception)?.Message);
        };
    }
}
