using Microsoft.AspNetCore.Builder;

namespace Chimera.Identity.API.Core;

/// <summary>
/// Configures the middleware pipeline (UseRouting, UseAuth, UseCors, etc.).
/// Runs before any endpoints are mapped. Typically one implementation per application.
/// </summary>
public interface IMiddlewareConfigurator
{
    /// <summary>
    /// Adds middleware to the request pipeline. Called before UseEndpoints.
    /// </summary>
    void Configure(IApplicationBuilder app);
}
