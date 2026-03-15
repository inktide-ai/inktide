using System.Reflection;
using Chimera.API.Deployment;
using DryIoc;
using Serilog;

namespace Chimera.API
{

    internal class Program
    {

        public static int Main()
        {


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
                Log.Logger?.Fatal("Application start up failed: {}",ex);
                throw;
            }
            finally
            {
                Log.CloseAndFlush();
            }

            return 0;


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