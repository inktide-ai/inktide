using Microsoft.Extensions.Logging;
using Chimera.API.Identify.Application.Interfaces.Auth;
using Chimera.API.Identify.Application.Models.Auth;
using Chimera.API.Identify.Domain.Repositories;

namespace Chimera.API.Identify.Application.Services;

/// <summary>
/// Resolves users from OAuth provider claims and issues sessions.
/// Implements find-by-provider-id, link-by-email, or create-new logic.
/// </summary>
public sealed class ExternalAuthService : IExternalAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IRefreshTokenStore _refreshTokenStore;
    private readonly ITokenService _tokenService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<ExternalAuthService> _logger;

    public ExternalAuthService(
        IUserRepository userRepository,
        IRefreshTokenStore refreshTokenStore,
        ITokenService tokenService,
        IPasswordHasher passwordHasher,
        ILogger<ExternalAuthService> logger)
    {
        _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
        _refreshTokenStore = refreshTokenStore ?? throw new ArgumentNullException(nameof(refreshTokenStore));
        _tokenService = tokenService ?? throw new ArgumentNullException(nameof(tokenService));
        _passwordHasher = passwordHasher ?? throw new ArgumentNullException(nameof(passwordHasher));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc/>
    public async Task<AuthResult> AuthenticateGoogleAsync(
        string googleId,
        string email,
        string? displayName,
        CancellationToken ct = default)
    {
        var normalizedEmail = NormalizeEmail(email);

        var user = await _userRepository.GetByGoogleIdAsync(googleId, ct);
        if (user is not null)
        {
            _logger.LogInformation("User authenticated via Google. UserId={UserId}", user.Id);
            return await IssueSessionAsync(user.Id.ToString(), user.Role, ct);
        }

        user = await _userRepository.GetByEmailAsync(normalizedEmail, ct);
        if (user is not null)
        {
            await _userRepository.LinkGoogleAsync(user.Id, googleId, ct);
            _logger.LogInformation("Linked Google account to existing user. UserId={UserId}", user.Id);
            return await IssueSessionAsync(user.Id.ToString(), user.Role, ct);
        }

        var passwordHash = _passwordHasher.Hash(Guid.NewGuid().ToString("N"));
        user = await _userRepository.CreateFromOAuthAsync(
            normalizedEmail, displayName, passwordHash, googleId, null, ct);
        _logger.LogInformation("Created user from Google OAuth. UserId={UserId}", user.Id);
        return await IssueSessionAsync(user.Id.ToString(), user.Role, ct);
    }

    /// <inheritdoc/>
    public async Task<AuthResult> AuthenticateTwitchAsync(
        string twitchId,
        string email,
        string? displayName,
        CancellationToken ct = default)
    {
        var normalizedEmail = NormalizeEmail(email);

        var user = await _userRepository.GetByTwitchIdAsync(twitchId, ct);
        if (user is not null)
        {
            _logger.LogInformation("User authenticated via Twitch. UserId={UserId}", user.Id);
            return await IssueSessionAsync(user.Id.ToString(), user.Role, ct);
        }

        user = await _userRepository.GetByEmailAsync(normalizedEmail, ct);
        if (user is not null)
        {
            await _userRepository.LinkTwitchAsync(user.Id, twitchId, ct);
            _logger.LogInformation("Linked Twitch account to existing user. UserId={UserId}", user.Id);
            return await IssueSessionAsync(user.Id.ToString(), user.Role, ct);
        }

        var passwordHash = _passwordHasher.Hash(Guid.NewGuid().ToString("N"));
        user = await _userRepository.CreateFromOAuthAsync(
            normalizedEmail, displayName, passwordHash, null, twitchId, ct);
        _logger.LogInformation("Created user from Twitch OAuth. UserId={UserId}", user.Id);
        return await IssueSessionAsync(user.Id.ToString(), user.Role, ct);
    }

    private async Task<AuthResult> IssueSessionAsync(string userId, string role, CancellationToken ct)
    {
        var family = Guid.NewGuid().ToString("N");
        var accessToken = _tokenService.GenerateAccessToken(userId, role);
        var refreshToken = _tokenService.GenerateRefreshToken();

        await _refreshTokenStore.StoreAsync(
            refreshToken.Value, userId, role, family, refreshToken.Lifetime, ct);

        return new AuthResult(
            accessToken.Value,
            "Bearer",
            accessToken.LifetimeSeconds,
            refreshToken.Value,
            refreshToken.LifetimeSeconds);
    }

    private static string NormalizeEmail(string email) =>
        email.Trim().ToLowerInvariant();
}
