using System.Reflection;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;

var rootPath = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
if (!string.IsNullOrEmpty(rootPath))
{
    Directory.SetCurrentDirectory(rootPath);
    Environment.SetEnvironmentVariable("BASEDIR", rootPath);
}

var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
    ?? Environment.GetEnvironmentVariable("NETCORE_ENVIRONMENT")
    ?? "Development";

var configuration = new ConfigurationBuilder()
    .SetBasePath(rootPath ?? ".")
    .AddJsonFile("appsettings.json", false, true)
    .AddJsonFile($"appsettings.{environment}.json", true, true)
    .AddJsonFile($"appsettings.{environment}.User.json", true, true)
    .AddEnvironmentVariables()
    .AddUserSecrets(Assembly.GetExecutingAssembly(), true)
    .Build();

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(configuration)
    .CreateLogger();

var serverSection = configuration.GetSection("Server");
var listenAddress = serverSection["ListenAddress"] ?? "127.0.0.1";
var listenPort = serverSection.GetValue<int>("ListenPort", 8080);
Environment.SetEnvironmentVariable("ASPNETCORE_URLS", $"http://{listenAddress}:{listenPort}");

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.Host.UseSerilog();

    builder.Services.AddReverseProxy()
        .LoadFromConfig(configuration.GetSection("ReverseProxy"));

    var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
    if (allowedOrigins.Length > 0)
    {
        builder.Services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy.WithOrigins(allowedOrigins)
                    .AllowAnyMethod()
                    .AllowAnyHeader();
            });
        });
    }

    var obs = configuration.GetSection("ObservabilitySettings");
    var serviceName = obs["ServiceName"] ?? "chimera-api-gateway";
    var otlpEndpoint = obs["OtlpEndpoint"] ?? "http://localhost:4317";
    var enableMetrics = obs.GetValue<bool>("EnableMetrics");
    var enableTracing = obs.GetValue<bool>("EnableTracing");

    builder.Services.AddOpenTelemetry()
        .ConfigureResource(r => r.AddService(serviceName))
        .WithMetrics(m =>
        {
            if (enableMetrics)
            {
                m.AddAspNetCoreInstrumentation();
                m.AddHttpClientInstrumentation();
                m.AddPrometheusExporter();
            }
        })
        .WithTracing(t =>
        {
            if (enableTracing)
            {
                t.AddAspNetCoreInstrumentation();
                t.AddHttpClientInstrumentation();
                t.AddOtlpExporter(o => o.Endpoint = new Uri(otlpEndpoint));
            }
        });

    var app = builder.Build();

    app.UseSerilogRequestLogging();

    if (allowedOrigins.Length > 0)
    {
        app.UseCors();
    }

    app.UseRouting();
    app.MapReverseProxy();

    if (enableMetrics)
    {
        app.MapPrometheusScrapingEndpoint();
    }

    Log.Information("YARP API Gateway starting on http://{Address}:{Port}", listenAddress, listenPort);
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application startup failed");
    throw;
}
finally
{
    await Log.CloseAndFlushAsync();
}
