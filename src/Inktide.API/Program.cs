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
            ValidateRequiredSecrets(configuration);

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

        private static void ValidateRequiredSecrets(IConfiguration configuration)
        {
            string[] secretKeys =
            [
                "PostgresSettings:Database",
                "PostgresSettings:Username",
                "PostgresSettings:Password",
                "KeycloakAdminSettings:ClientId",
                "KeycloakAdminSettings:ClientSecret",
                "S3Settings:AccessKey",
                "S3Settings:SecretKey",
                "DataProtection:MasterKey",
                "DiscordSettings:BotToken",
                "DiscordSettings:ClientId",
                "DiscordSettings:ClientSecret",
                "AuthSettings:SigningSecret",
            ];

            var violations = secretKeys
                .Where(key => string.Equals(
                    configuration[key], "CHANGE_ME",
                    StringComparison.OrdinalIgnoreCase))
                .ToList();

            if (violations.Count == 0) return;

            var list = string.Join(Environment.NewLine,
                violations.Select(k => $"  • {k.Replace(":", "__")}"));

            throw new InvalidOperationException(
                $"Cannot start: {violations.Count} secret(s) still have the CHANGE_ME placeholder.{Environment.NewLine}" +
                $"Set the following environment variables in .env:{Environment.NewLine}{list}");
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