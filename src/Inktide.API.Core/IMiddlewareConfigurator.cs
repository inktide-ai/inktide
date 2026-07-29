using Microsoft.AspNetCore.Builder;

namespace Inktide.API.Core;

/// <summary>
/// Configures the middleware pipeline (UseRouting, UseAuth, UseCors, etc.).
/// Runs before any endpoints are mapped. Implementations are sorted by <see cref="Order"/>
/// (lowest first) to guarantee a deterministic pipeline regardless of assembly load order.
/// </summary>
public interface IMiddlewareConfigurator
{
    /// <summary>
    /// Execution order in the middleware pipeline. Lower values run first.
    /// Convention: 0-99 = infrastructure (exception, routing, CORS, auth), 100+ = application.
    /// </summary>
    int Order => 100;

    /// <summary>
    /// Adds middleware to the request pipeline. Called before UseEndpoints.
    /// </summary>
    void Configure(IApplicationBuilder app);
}
