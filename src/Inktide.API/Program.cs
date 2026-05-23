using System.Reflection;
using Inktide.API.Deployment;
using Serilog;

namespace Inktide.API
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

                Log.Logger?.Information("Application is starting...");

                host.Run();


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

            var builder = new ConfigurationBuilder()
                .SetBasePath(rootPath)
                .AddJsonFile("appsettings.json", false, true)
                .AddJsonFile($"appsettings.{environment}.json", true)
                .AddJsonFile($"appsettings.{environment}.User.json", true)
                .AddEnvironmentVariables();

            return builder.Build();

        }
    }
}