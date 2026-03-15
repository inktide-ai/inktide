using System.Reflection;
using Chimera.API.Core;
using Chimera.API.Settings;
using DryIoc;
using DryIoc.Microsoft.DependencyInjection;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;
using IStartup = Chimera.API.Core.IStartup;

namespace Chimera.API.Deployment;

/// <summary>
/// Configures the application host and web pipeline.
/// </summary>
/// <remarks>
/// <para><b>DI Architecture (DryIoc vs MS DI):</b></para>
/// <list type="bullet">
///   <item><b>DryIoc</b> — primary container used as the app's service provider (via DryIocServiceProviderFactory).
///   Hosts App, ILogger&lt;T&gt;, IServiceRegistrator implementations, modules dictionary, and custom registrations.</item>
///   <item><b>MS DI (IServiceCollection)</b> — used for ASP.NET Core built-in services (Authentication, Authorization,
///   MVC, Configuration). Registrations are populated into DryIoc when the host starts.</item>
/// </list>
/// </remarks>
public static class Startup
{
    /// <summary>
    /// Creates and configures the host builder.
    /// </summary>
    public static IHostBuilder CreateHostBuilder(
        string? rootPath = null,
        Action<HostBuilderContext, IServiceCollection>? additionalConfigureServices = null
    )
    {
        // setup directory for relative path
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
                            .AddJsonFile($"appsettings.{context.HostingEnvironment.EnvironmentName}.User.json", true,
                                true)
                            .AddEnvironmentVariables();

                        configurationBuilder.AddUserSecrets(Assembly.GetExecutingAssembly(), optional: true);

                        modules = new Dictionary<string, ModuleInfo>();
                        configurationBuilder.Build().Bind("Modules", modules);

                        foreach (var kvp in modules.Where(m => m.Value.Enabled))
                        {
                            Log.Logger?.Information("Adding module \"{ModuleKey}\" from assembly \"{Assembly}\"",
                                kvp.Key, kvp.Value.AssemblyName);
                            var assemblyPath = Path.IsPathRooted(kvp.Value.AssemblyName)
                                ? kvp.Value.AssemblyName
                                : Path.Combine(rootPath, kvp.Value.AssemblyName);
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
                        var middlewareConfigurators = AppDomain.CurrentDomain.GetAssemblies()
                            .Distinct()
                            .SelectMany(a => a.DefinedTypes)
                            .Where(t => t.ImplementsServiceType<IMiddlewareConfigurator>())
                            .Select(t => (IMiddlewareConfigurator)Activator.CreateInstance(t)!)
                            .ToList();

                        foreach (var middleware in middlewareConfigurators)
                        {
                            middleware.Configure(applicationBuilder);
                        }

                        if (middlewareConfigurators.Count == 0)
                        {
                            applicationBuilder.UseRouting();
                        }

                        var endpointConfigurators = AppDomain.CurrentDomain.GetAssemblies()
                            .Distinct()
                            .SelectMany(a => a.DefinedTypes)
                            .Where(t => t.ImplementsServiceType<IEndpointConfigurator>())
                            .Select(t => (IEndpointConfigurator)Activator.CreateInstance(t)!)
                            .ToList();

                        applicationBuilder.UseEndpoints(endpoints =>
                        {
                            foreach (var ep in endpointConfigurators)
                            {
                                ep.Map(endpoints);
                            }
                        });
                        
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
                    .Where(t => t is { IsClass: true, IsAbstract: false } && t.ImplementsServiceType<IStartup>())
                    .Select(t => (IStartup)Activator.CreateInstance(t)!)
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

        if (ctx.HostingEnvironment.IsDevelopment())
        {
            services.AddDataProtection().UseEphemeralDataProtectionProvider();
        }
        
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