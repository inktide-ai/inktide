using System.Text.Json;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Inktide.API.Core;

namespace Inktide.API.Connector.Infrastructure.Endpoints;

/// <summary>
/// Maps health check endpoints and controllers.
/// /health/live  - liveness probe: returns 200 if the process is running (no dependency checks).
/// /health/ready - readiness probe: returns 200 only when all "ready"-tagged checks pass.
/// </summary>
public sealed class StreamingConnectorEndpointConfigurator : IEndpointConfigurator
{
    public void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapHealthChecks("/health/live", new HealthCheckOptions
        {
            Predicate = _ => false // process is alive iff this endpoint responds
        });

        endpoints.MapHealthChecks("/health/ready", new HealthCheckOptions
        {
            Predicate        = check => check.Tags.Contains("ready"),
            ResponseWriter   = WriteHealthResponse
        });

        endpoints.MapControllers();
    }

    private static async Task WriteHealthResponse(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = report.Status == HealthStatus.Healthy ? 200 : 503;

        var defaultDescriptions = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["redis"] = "Redis connectivity (cache, Synapse ingest stream)"
        };

        var result = new
        {
            status = report.Status == HealthStatus.Healthy ? "healthy" : "unhealthy",
            timestamp = DateTime.UtcNow,
            version = "1.0",
            checks = report.Entries.ToDictionary(
                e => e.Key,
                e => new
                {
                    status = e.Value.Status.ToString(),
                    description = e.Value.Description ?? defaultDescriptions.GetValueOrDefault(e.Key)
                })
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(result));
    }
}
