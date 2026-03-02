using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Chimera.ApiGateway.Core;
using Chimera.ApiGateway.Infrastructure.Settings;
using Npgsql;

namespace Chimera.ApiGateway.Infrastructure.DependencyInjection;

/// <summary>
/// Registers OpenTelemetry tracing and metrics with all relevant instrumentations.
/// Traces export via OTLP to Tempo; metrics are scraped by Prometheus at /metrics.
/// </summary>
public sealed class ObservabilityStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        var settings = new ObservabilitySettings();
        ctx.Configuration.GetSection(nameof(ObservabilitySettings)).Bind(settings);

        services.AddOptions<ObservabilitySettings>()
            .BindConfiguration(nameof(ObservabilitySettings))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        var resourceBuilder = ResourceBuilder.CreateDefault()
            .AddService(
                serviceName: settings.ServiceName,
                serviceVersion: typeof(ObservabilityStartup).Assembly.GetName().Version?.ToString() ?? "1.0.0");

        if (settings.EnableTracing)
        {
            services.AddOpenTelemetry()
                .WithTracing(tracing =>
                {
                    tracing
                        .SetResourceBuilder(resourceBuilder)
                        .AddAspNetCoreInstrumentation(opts =>
                        {
                            opts.RecordException = true;
                            opts.Filter = httpContext =>
                                !httpContext.Request.Path.StartsWithSegments("/health") &&
                                !httpContext.Request.Path.StartsWithSegments("/metrics");
                        })
                        .AddHttpClientInstrumentation()
                        .AddNpgsql()
                        .AddOtlpExporter(otlp => otlp.Endpoint = new Uri(settings.OtlpEndpoint));
                });
        }

        if (settings.EnableMetrics)
        {
            services.AddOpenTelemetry()
                .WithMetrics(metrics =>
                {
                    metrics
                        .SetResourceBuilder(resourceBuilder)
                        .AddAspNetCoreInstrumentation()
                        .AddHttpClientInstrumentation()
                        .AddRuntimeInstrumentation()
                        .AddPrometheusExporter();
                });
        }
    }
}
