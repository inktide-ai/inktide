using System.Net.Mime;
using System.Text.Json;
using Inktide.API.Core.Models;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Core.Middleware;

public static class GlobalExceptionHandlerExtensions
{

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };


    public static IApplicationBuilder UseInktideGlobalExceptionHandler(this IApplicationBuilder app)
    {
        app.UseExceptionHandler(errorApp =>
        {
            errorApp.Run(async context =>
            {
                if (context.Response.HasStarted)
                {
                    return;
                }

                var feature = context.Features.Get<IExceptionHandlerFeature>();
                var ex = feature?.Error;

                var loggerFactory = context.RequestServices.GetRequiredService<ILoggerFactory>();
                var logger = loggerFactory.CreateLogger("Inktide.GlobalException");

                var env = context.RequestServices.GetService<IWebHostEnvironment>();
                var isDevelopment = env?.IsDevelopment() == true;

                if (ex is not null)
                {
                    logger.LogError(
                        ex,
                        "Unhandled exception. Path={Path} TraceId={TraceId}",
                        context.Request.Path.Value,
                        context.TraceIdentifier);
                }
                else
                {
                    logger.LogError(
                        "Unhandled exception (no IExceptionHandlerFeature.Error). Path={Path} TraceId={TraceId}",
                        context.Request.Path.Value,
                        context.TraceIdentifier);
                }

                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                context.Response.ContentType = MediaTypeNames.Application.Json;

                var payload = HttpErrorPayload.Internal(
                    context.TraceIdentifier,
                    isDevelopment,
                    ex?.ToString());

                await context.Response.WriteAsync(JsonSerializer.Serialize(payload, JsonOptions));
            });
        });

        return app;
    }

}
