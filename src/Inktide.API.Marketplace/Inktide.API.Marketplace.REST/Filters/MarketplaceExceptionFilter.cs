using Inktide.API.Marketplace.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Inktide.API.Marketplace.REST.Filters;

public sealed class MarketplaceExceptionFilter : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        context.Result = context.Exception switch
        {
            UnauthorizedAccessException    => new UnauthorizedResult(),
            SoulNotOwnedException or
            ConnectorNotFoundException or
            InstallationNotFoundException  => new NotFoundResult(),
            ConnectorUnavailableException or
            InvalidConnectorSlugException  => new BadRequestObjectResult(
                new { error = context.Exception.Message }),
            _                              => null, // unhandled exceptions bubble to global 500 handler — intentional
        };

        if (context.Result is not null)
            context.ExceptionHandled = true;
    }
}
