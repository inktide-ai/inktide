using Microsoft.AspNetCore.Builder;

namespace Chimera.Identity.API.REST.Middleware;

/// <summary>
/// Extension methods for ExceptionHandlingMiddleware.
/// </summary>
public static class ExceptionHandlingMiddlewareExtensions
{
    public static IApplicationBuilder UseExceptionHandling(this IApplicationBuilder app)
    {
        return app.UseMiddleware<ExceptionHandlingMiddleware>();
    }
}
