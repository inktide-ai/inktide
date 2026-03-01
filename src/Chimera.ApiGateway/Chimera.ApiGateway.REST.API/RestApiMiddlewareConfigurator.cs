using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Chimera.ApiGateway.Core;
using Chimera.ApiGateway.REST.API.Middleware;
using Serilog;

namespace Chimera.ApiGateway.REST.API;

/// <summary>
/// Configures the REST API middleware pipeline: exception handling, logging, routing, CORS, rate limiting, auth, Swagger.
/// </summary>
public sealed class RestApiMiddlewareConfigurator : IMiddlewareConfigurator
{
    public void Configure(IApplicationBuilder app)
    {
        var env = app.ApplicationServices.GetRequiredService<IHostEnvironment>();

        app.UseExceptionHandling();
        app.UseSerilogRequestLogging();
        app.UseRouting();
        app.UseCors();
        app.UseRateLimiter();
        app.UseAuthentication();
        app.UseAuthorization();

        if (env.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Chimera API v1"));
        }
    }
}
