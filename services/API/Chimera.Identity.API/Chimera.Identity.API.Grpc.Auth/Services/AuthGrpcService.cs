using Grpc.Core;
using Chimera.Identity.Application.Exceptions;
using Chimera.Identity.Application.Interfaces.Auth;
using Chimera.Identity.API.Grpc.Auth.Converters;
using Chimera.Identity.API.Grpc.Contracts.Auth;

namespace Chimera.Identity.API.Grpc.Auth.Services;

/// <summary>gRPC implementation of the Auth service.</summary>
public sealed class AuthGrpcService : AuthService.AuthServiceBase
{
    #region Constants

    private const int PasswordMinLength = 8;

    #endregion

    #region Fields

    private readonly IAuthService _authService;

    #endregion

    #region Constructors

    public AuthGrpcService(IAuthService authService)
    {
        _authService = authService ?? throw new ArgumentNullException(nameof(authService));
    }

    #endregion

    #region Public Methods

    public override async Task<AuthResponse> Register(RegisterRequest request, ServerCallContext context)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Email and password are required."));
        }

        if (request.Password.Length < PasswordMinLength)
        {
            throw new RpcException(new Status(
                StatusCode.InvalidArgument,
                $"Password must be at least {PasswordMinLength} characters."));
        }

        try
        {
            var result = await _authService.RegisterAsync(
                request.Email,
                request.Password,
                string.IsNullOrWhiteSpace(request.DisplayName) ? null : request.DisplayName,
                context.CancellationToken);

            return AuthGrpcConverter.ToAuthResponse(result);
        }
        catch (UserAlreadyExistsException ex)
        {
            throw new RpcException(new Status(StatusCode.AlreadyExists, ex.Message));
        }
    }

    public override async Task<AuthResponse> Login(LoginRequest request, ServerCallContext context)
    {
        var hasApiKey = request.HasApiKey && !string.IsNullOrWhiteSpace(request.ApiKey);
        var hasCredentials = hasApiKey
            || (request.HasEmailOrUsername
                && request.HasPassword
                && !string.IsNullOrWhiteSpace(request.EmailOrUsername)
                && !string.IsNullOrWhiteSpace(request.Password));

        if (!hasCredentials)
        {
            throw new RpcException(new Status(
                StatusCode.InvalidArgument,
                "ApiKey or EmailOrUsername + Password required."));
        }

        var result = await _authService.LoginAsync(
            hasApiKey ? request.ApiKey : null,
            request.EmailOrUsername,
            request.Password,
            context.CancellationToken);

        if (result is null)
        {
            throw new RpcException(new Status(StatusCode.Unauthenticated, "Invalid credentials."));
        }

        return AuthGrpcConverter.ToAuthResponse(result);
    }

    public override async Task<AuthResponse> Refresh(RefreshRequest request, ServerCallContext context)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Refresh token is required."));
        }

        var result = await _authService.RefreshAsync(request.RefreshToken, context.CancellationToken);

        if (result is null)
        {
            throw new RpcException(new Status(StatusCode.Unauthenticated, "Invalid or expired refresh token."));
        }

        return AuthGrpcConverter.ToAuthResponse(result);
    }

    public override async Task<LogoutResponse> Logout(LogoutRequest request, ServerCallContext context)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Refresh token is required."));
        }

        await _authService.LogoutAsync(request.RefreshToken, context.CancellationToken);

        return new LogoutResponse { Success = true };
    }

    #endregion
}
