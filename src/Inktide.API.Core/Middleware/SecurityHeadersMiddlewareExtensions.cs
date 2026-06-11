using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Inktide.API.Core.Middleware;

public static class SecurityHeadersMiddlewareExtensions
{

    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
        => app.Use(static (context, next) =>
        {
            var headers = context.Response.Headers;
            headers["X-Content-Type-Options"]  = "nosniff";
            headers["X-Frame-Options"]         = "DENY";
            headers["Referrer-Policy"]         = "strict-origin-when-cross-origin";
            headers["X-Permitted-Cross-Domain-Policies"] = "none";
            headers["Content-Security-Policy"] =
                "default-src 'none'; " +
                "frame-ancestors 'none'; " +
                "base-uri 'none'; " +
                "form-action 'self'";
            return next(context);
        });

}
