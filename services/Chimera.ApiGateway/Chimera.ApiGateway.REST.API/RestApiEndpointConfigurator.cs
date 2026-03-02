using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Chimera.ApiGateway.Core;

namespace Chimera.ApiGateway.REST.API;

/// <summary>
/// Maps REST API endpoints: health checks, controllers, Prometheus metrics.
/// </summary>
public sealed class RestApiEndpointConfigurator : IEndpointConfigurator
{
    public void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapHealthChecks("/health", new HealthCheckOptions
        {
            ResponseWriter = WriteHealthResponse
        });
        endpoints.MapControllers();
        endpoints.MapPrometheusScrapingEndpoint();
    }

    private static async Task WriteHealthResponse(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = report.Status == HealthStatus.Healthy ? 200 : 503;

        var defaultDescriptions = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["postgres"] = "PostgreSQL database connectivity",
            ["redis"] = "Redis cache connectivity"
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
