using DryIoc;
using DryIoc.Microsoft.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Serilog;
using System.Reflection;
using Chimera.AI.Orchestrator.Deployment;

namespace Chimera.AI.Orchestrator;

internal class Program
{
    public static int Main()
    {
        ConfigureThreadPool();

        var configuration = BuildConfiguration();

        Log.Logger = new LoggerConfiguration()
            .ReadFrom.Configuration(configuration)
            .CreateLogger();

        try
        {
            var host = Startup.CreateHostBuilder().Build();

            Log.Logger?.Information("Application is starting up...");

            var container = host.Services.GetRequiredService<IContainer>();

            Log.Logger?.Information(
                "Dependency container has been initialized. Resolving application...");

            var app = container.Resolve<App>();

            Log.Logger?.Information("Application resolved from the container. Starting application...");

            app.Start();
        }
        catch (Exception ex)
        {
            Log.Logger?.Fatal("Application start up failed: {}", ex);
            throw;
        }
        finally
        {
            Log.CloseAndFlush();
        }

        return 0;
    }

    private static void ConfigureThreadPool()
    {
        ThreadPool.GetMinThreads(out var minWorker, out var minIocp);
        var targetWorker = Math.Max(minWorker, 100);
        var targetIocp = Math.Max(minIocp, 100);
        ThreadPool.SetMinThreads(targetWorker, targetIocp);
    }

    private static IConfiguration BuildConfiguration()
    {
        var rootPath = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
        Environment.SetEnvironmentVariable("BASEDIR", rootPath);

        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
                          ?? "Production";

        return new ConfigurationBuilder()
            .SetBasePath(rootPath!)
            .AddJsonFile("appsettings.json", false, true)
            .AddJsonFile($"appsettings.{environment}.json", true)
            .AddJsonFile($"appsettings.{environment}.User.json", true)
            .AddEnvironmentVariables()
            .Build();
    }
}
