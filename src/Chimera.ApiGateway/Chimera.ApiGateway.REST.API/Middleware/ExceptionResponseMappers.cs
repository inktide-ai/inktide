using System.Net;
using Chimera.ApiGateway.Application.Exceptions;
using Chimera.ApiGateway.REST.API.Models;

namespace Chimera.ApiGateway.REST.API.Middleware;

/// <summary>Maps <see cref="UserAlreadyExistsException"/> to 409 Conflict.</summary>
internal sealed class UserAlreadyExistsExceptionMapper : IExceptionResponseMapper
{
    public bool CanMap(Exception exception) => exception is UserAlreadyExistsException;

    public (HttpStatusCode, ApiErrorResponse) Map(Exception exception) =>
        (HttpStatusCode.Conflict, ApiErrorResponse.From(
            "User with this email already exists.",
            ErrorCodes.UserExists));
}

/// <summary>Maps <see cref="UniqueConstraintViolationException"/> to 409 Conflict.</summary>
internal sealed class UniqueConstraintViolationExceptionMapper : IExceptionResponseMapper
{
    public bool CanMap(Exception exception) => exception is UniqueConstraintViolationException;

    public (HttpStatusCode, ApiErrorResponse) Map(Exception exception) =>
        (HttpStatusCode.Conflict, ApiErrorResponse.From(
            "Resource already exists.",
            ErrorCodes.Conflict));
}
