using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Chimera.Identity.API.REST.Models;

namespace Chimera.Identity.API.REST.Middleware;

/// <summary>
/// Global exception handler. Delegates exception-to-response mapping to registered
/// <see cref="IExceptionResponseMapper"/> implementations (OCP). Unknown exceptions return 500.
/// Internal error details are hidden in non-Development environments.
/// </summary>
public sealed class ExceptionHandlingMiddleware
{
    #region Fields

    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IWebHostEnvironment _env;
    private readonly IReadOnlyList<IExceptionResponseMapper> _mappers;

    #endregion

    #region Constructors

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IWebHostEnvironment env,
        IEnumerable<IExceptionResponseMapper> mappers)
    {
        _next = next ?? throw new ArgumentNullException(nameof(next));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _env = env ?? throw new ArgumentNullException(nameof(env));
        _mappers = (mappers ?? throw new ArgumentNullException(nameof(mappers))).ToList();
    }

    #endregion

    #region Public Methods

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    #endregion

    #region Private Methods

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var mapper = _mappers.FirstOrDefault(m => m.CanMap(exception));
        var (statusCode, response) = mapper is not null
            ? mapper.Map(exception)
            : CreateInternalErrorResponse(exception);

        _logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);

        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json";

        await context.Response.WriteAsync(JsonConvert.SerializeObject(response));
    }

    private (HttpStatusCode, ApiErrorResponse) CreateInternalErrorResponse(Exception exception)
    {
        var message = _env.IsDevelopment()
            ? exception.Message
            : "An internal server error occurred.";

        return (HttpStatusCode.InternalServerError, ApiErrorResponse.From(message, ErrorCodes.InternalError));
    }

    #endregion
}
