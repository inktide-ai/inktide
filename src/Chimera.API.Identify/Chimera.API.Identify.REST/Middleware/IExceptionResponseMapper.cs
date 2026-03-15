using System.Net;
using Chimera.API.Identify.REST.Models;

namespace Chimera.API.Identify.REST.Middleware;

/// <summary>
/// Maps a specific exception type to an HTTP status code and error response body.
/// Implement to add support for a new exception without touching <see cref="ExceptionHandlingMiddleware"/>.
/// </summary>
public interface IExceptionResponseMapper
{
    /// <summary>Returns true when this mapper knows how to handle <paramref name="exception"/>.</summary>
    bool CanMap(Exception exception);

    /// <summary>Produces the HTTP status and body for the given exception.</summary>
    (HttpStatusCode StatusCode, ApiErrorResponse Response) Map(Exception exception);
}
