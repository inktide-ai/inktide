using System.Diagnostics.Metrics;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;

namespace Inktide.API.Core.Observability;

/// <summary>
/// Registers OpenTelemetry tracing + metrics for all Inktide contexts.
/// Auto-discovered from Core by the module scanner - no appsettings entry needed.
///
/// Metrics endpoint: GET /metrics (Prometheus scrape format).
///
/// SLO meters: <c>synapse_e2e_latency_ms</c>, <c>synapse_context_degraded_rate</c>, <c>synapse_gpu_queue_depth</c>.
/// NOTE: these instruments are DEFINED but NOT YET INSTRUMENTED - the Synapse pipeline does not
/// record against them yet (see <see cref="E2ELatencyMs"/>, <see cref="ContextDegradedRate"/>,
/// <see cref="SetGpuQueueDepth"/>: no callers). They export as empty series until wired up.
/// </summary>
public sealed class ObservabilityStartup : IStartup, IMiddlewareConfigurator
{
    public const string MeterName = "Inktide";

    // SLO meter and instruments - static so Synapse infrastructure can record against them.
    private static readonly Meter SynapseMeter = new(MeterName, "1.0");

    /// <summary>End-to-end pipeline latency in milliseconds. SLO: p95 &lt; 4000 ms.</summary>
    public static readonly Histogram<double> E2ELatencyMs =
        SynapseMeter.CreateHistogram<double>("synapse_e2e_latency_ms", "ms", "Message-to-voice end-to-end latency.");

    /// <summary>Count of responses served without full context (history or RAG missing).</summary>
    public static readonly Counter<long> ContextDegradedRate =
        SynapseMeter.CreateCounter<long>("synapse_context_degraded_rate", "1", "Responses without full context.");

    /// <summary>Current depth of the vLLM/Ollama request queue.</summary>
    public static readonly ObservableGauge<int> GpuQueueDepth =
        SynapseMeter.CreateObservableGauge("synapse_gpu_queue_depth", () => _gpuQueueDepth, "1", "GPU inference queue depth.");

    private static int _gpuQueueDepth;

    /// <summary>Call this from the LLM worker to update the queue depth gauge.</summary>
    public static void SetGpuQueueDepth(int depth) => _gpuQueueDepth = depth;

    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddOpenTelemetry()
            .WithTracing(tracing => tracing
                .AddAspNetCoreInstrumentation()
                .AddHttpClientInstrumentation())
            .WithMetrics(metrics => metrics
                .AddAspNetCoreInstrumentation()
                .AddMeter(MeterName)
                .AddPrometheusExporter());
    }

    public void Configure(IApplicationBuilder app) =>
        app.UseOpenTelemetryPrometheusScrapingEndpoint();
}
