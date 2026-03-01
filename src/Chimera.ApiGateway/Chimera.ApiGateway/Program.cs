using DryIoc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Serilog;
using System.Reflection;
using Chimera.ApiGateway.Deployment;

namespace Chimera.ApiGateway
{

    internal class Program
    {

        public static int Main()
        {
            
            // config for ThreadPool and Serilog
            var configuration = BuildConfiguration();

            ConfigureThreadPool(configuration);

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
                Log.Logger?.Fatal("Application start up failed: {}",ex);
                throw;
            }
            finally
            {
                Log.CloseAndFlush();
            }

            return 0;


        }

        private static void ConfigureThreadPool(IConfiguration configuration)
        {
       
            ThreadPool.GetMinThreads(out var currentWorker, out var currentIo);
            
            ThreadPool.SetMinThreads(
                Math.Max(
                    currentWorker,
                    // minimum threads for computations (query processing, business logic)
                    configuration.GetValue<int>("ThreadPool:MinWorkerThreads", 100) 
                ),
                Math.Max(
                    currentIo, 
                    // minimum threads for I/O (network, database, Redis, RabbitMQ)
                    configuration.GetValue<int>("ThreadPool:MinIoThreads", 100)
                )
            );
            
        }

        private static IConfiguration BuildConfiguration()
        {
            var rootPath = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
            
            Environment.SetEnvironmentVariable("BASEDIR", rootPath);

            var environment = Environment.GetEnvironmentVariable("NETCORE_ENVIRONMENT");
            var isDevelopment = string.IsNullOrEmpty(environment) || environment.ToLower() == "development";
            
            var builder = new ConfigurationBuilder()
                .SetBasePath(rootPath)
                .AddJsonFile("appsettings.json", false, true)
                .AddJsonFile($"appsettings.{environment}.json", true)
                .AddJsonFile($"appsettings.{environment}.User.json", true)
                .AddEnvironmentVariables();

            if (isDevelopment)
            {
                builder.AddUserSecrets<Program>();
            }
            
            return builder.Build();

        }
    }
}