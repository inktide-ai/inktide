using Inktide.API.Organization.Application.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Inktide.API.Organization.REST.Filters;

public sealed class OrganizationExceptionFilter : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        context.Result = context.Exception switch
        {
            NotAnAdminException            => new ForbidResult(),
            InviteNotFoundException        => new NotFoundResult(),
            InviteExpiredException         => new BadRequestObjectResult(new { code = "INVITE_EXPIRED" }),
            InviteAlreadyAcceptedException => new ConflictObjectResult(new { code = "ALREADY_ACCEPTED" }),
            _                              => null,  // unknown exceptions bubble up to global error handler -> 500
        };
        if (context.Result is not null)
            context.ExceptionHandled = true;
    }
}
