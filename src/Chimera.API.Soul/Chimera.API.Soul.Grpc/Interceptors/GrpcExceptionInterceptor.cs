using Grpc.Core;
using Grpc.Core.Interceptors;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Chimera.API.Soul.Application.Exceptions;

namespace Chimera.API.Soul.Grpc.Interceptors;

/// <summary>
/// Catches unhandled exceptions in Soul gRPC service methods and converts them to
/// well-typed <see cref="RpcException"/> responses.
/// In Development, includes exception details; in Production, returns a generic Internal error.
/// </summary>
public sealed class GrpcExceptionInterceptor : Interceptor
{
    #region Fields

    private readonly ILogger<GrpcExceptionInterceptor> _logger;
    private readonly bool _isDevelopment;

    #endregion

    #region Constructors

    public GrpcExceptionInterceptor(
        ILogger<GrpcExceptionInterceptor> logger,
        IHostEnvironment env)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _isDevelopment = (env ?? throw new ArgumentNullException(nameof(env))).IsDevelopment();
    }

    #endregion

    #region Public Methods

    public override async Task<TResponse> UnaryServerHandler<TRequest, TResponse>(
        TRequest request,
        ServerCallContext context,
        UnaryServerMethod<TRequest, TResponse> continuation)
    {
        try
        {
            return await continuation(request, context);
        }
        catch (RpcException)
        {
            throw;
        }
        catch (AiCardNotFoundException ex)
        {
            throw new RpcException(new Status(StatusCode.NotFound, ex.Message));
        }
        catch (SlugAlreadyExistsException ex)
        {
            throw new RpcException(new Status(StatusCode.AlreadyExists, ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled gRPC exception in {Method}", context.Method);

            var message = _isDevelopment
                ? $"{ex.GetType().Name}: {ex.Message}"
                : "An internal error occurred.";

            throw new RpcException(new Status(StatusCode.Internal, message));
        }
    }

    #endregion
}
