using Grpc.Core;
using Grpc.Core.Interceptors;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Chimera.ApiGateway.Grpc.Interceptors;

/// <summary>
/// Catches unhandled exceptions in gRPC service methods and converts them to safe RpcException responses.
/// In Development, includes exception details; in Production, returns a generic Internal error.
/// </summary>
public sealed class GrpcExceptionInterceptor : Interceptor
{
    private readonly ILogger<GrpcExceptionInterceptor> _logger;
    private readonly bool _isDevelopment;

    public GrpcExceptionInterceptor(ILogger<GrpcExceptionInterceptor> logger, IHostEnvironment env)
    {
        _logger = logger;
        _isDevelopment = env.IsDevelopment();
    }

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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled gRPC exception in {Method}", context.Method);

            var message = _isDevelopment
                ? $"{ex.GetType().Name}: {ex.Message}"
                : "An internal error occurred.";

            throw new RpcException(new Status(StatusCode.Internal, message));
        }
    }
}
