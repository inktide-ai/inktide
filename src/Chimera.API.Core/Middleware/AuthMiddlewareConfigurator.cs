using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Builder;

namespace Chimera.API.Core.Middleware;

/// <summary>
/// Configures the middleware pipeline with the correct order:
/// Global exception handler → CORS → Routing → Authentication → Authorization.
/// <para>
/// When this class exists, <see cref="Deployment.Startup"/> skips the default <c>UseRouting()</c>
/// because at least one <see cref="IMiddlewareConfigurator"/> is found.
/// </para>
/// </summary>
public sealed class AuthMiddlewareConfigurator : IMiddlewareConfigurator
{
    #region Fields

    private const string CorsPolicyName = "ChimeraPolicy";

    #endregion

    #region Public Methods

    public void Configure(IApplicationBuilder app)
    {
        app.UseChimeraGlobalExceptionHandler();
        app.UseCors(CorsPolicyName);
        app.UseRouting();
        app.UseRateLimiter();
        app.UseAuthentication();
        app.UseAuthorization();
    }

    #endregion
}
