using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Chimera.Identity.Application.Exceptions;
using Chimera.Identity.Application.Interfaces.Auth;
using Chimera.Identity.Application.Models.Auth;
using Chimera.Identity.API.Core.Settings;
using Chimera.Identity.Domain.Repositories;

namespace Chimera.Identity.Application.Services;

/// <summary>
/// Handles registration, login, token refresh and logout.
/// Delegates crypto to <see cref="IPasswordHasher"/> and <see cref="ITokenService"/>.
/// </summary>
public sealed class AuthService : IAuthService
{
    #region Constants

    private const string DevApiKeySubject = "dev-api-key-principal";
    private const string DevApiKeyRole    = "streamer";

    private const string DemoUsername = "demo";
    private const string DemoPassword = "demo";
    private const string DemoUserSubject = "demo-user";
    private const string DemoUserRole = "streamer";

    #endregion

    #region Fields

    private readonly IUserRepository _userRepository;
    private readonly IRefreshTokenStore _refreshTokenStore;
    private readonly ITokenService _tokenService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<AuthService> _logger;
    private readonly AuthSettings _settings;

    // Null when DevApiKey is not configured. Pre-encoded to avoid allocation per request.
    private readonly byte[]? _devApiKeyBytes;

    #endregion

    #region Constructors

    public AuthService(
        IUserRepository userRepository,
        IRefreshTokenStore refreshTokenStore,
        ITokenService tokenService,
        IPasswordHasher passwordHasher,
        IOptions<AuthSettings> options,
        ILogger<AuthService> logger)
    {
        _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
        _refreshTokenStore = refreshTokenStore ?? throw new ArgumentNullException(nameof(refreshTokenStore));
        _tokenService = tokenService ?? throw new ArgumentNullException(nameof(tokenService));
        _passwordHasher = passwordHasher ?? throw new ArgumentNullException(nameof(passwordHasher));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        _settings = options?.Value ?? throw new ArgumentNullException(nameof(options));

        _devApiKeyBytes = string.IsNullOrEmpty(_settings.DevApiKey)
            ? null
            : Encoding.UTF8.GetBytes(_settings.DevApiKey);
    }

    #endregion

    #region Public Methods

    /// <inheritdoc/>
    public async Task<AuthResult> RegisterAsync(
        string email,
        string password,
        string? displayName,
        CancellationToken ct = default)
    {
        var normalizedEmail = NormalizeEmail(email);
        var passwordHash = _passwordHasher.Hash(password);

        try
        {
            var user = await _userRepository.CreateAsync(normalizedEmail, passwordHash, displayName, ct);

            _logger.LogInformation("User registered. UserId={UserId}", user.Id);

            return await IssueSessionAsync(user.Id.ToString(), user.Role, ct);
        }
        catch (UniqueConstraintViolationException)
        {
            throw new UserAlreadyExistsException(normalizedEmail);
        }
    }

    /// <inheritdoc/>
    public async Task<AuthResult?> LoginAsync(
        string? apiKey,
        string? email,
        string? password,
        CancellationToken ct = default)
    {
        if (TryAuthenticateWithApiKey(apiKey, out var subject, out var role))
        {
            return await IssueSessionAsync(subject, role, ct);
        }

        if (_settings.EnableDemoLogin && IsDemoLogin(email, password))
        {
            _logger.LogWarning("Demo login used — must be disabled in production.");
            return await IssueSessionAsync(DemoUserSubject, DemoUserRole, ct);
        }

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return null;
        }

        var user = await _userRepository.GetByEmailAsync(NormalizeEmail(email), ct);

        if (user is null || !user.IsActive || !_passwordHasher.Verify(password, user.PasswordHash))
        {
            // Intentionally vague — do not reveal whether the email exists.
            _logger.LogWarning("Failed login attempt. Email={Email}", email);
            return null;
        }

        _logger.LogInformation("User authenticated. UserId={UserId}", user.Id);

        return await IssueSessionAsync(user.Id.ToString(), user.Role, ct);
    }

    /// <inheritdoc/>
    public async Task<AuthResult?> RefreshAsync(string refreshToken, CancellationToken ct = default)
    {
        var payload = await _refreshTokenStore.ConsumeAsync(refreshToken, ct);
        if (payload is null)
        {
            return null;
        }

        // Reuse the same familyId to keep the rotation chain traceable.
        return await IssueSessionAsync(payload.UserId, payload.Role, ct, familyId: payload.FamilyId);
    }

    /// <inheritdoc/>
    public async Task LogoutAsync(string refreshToken, CancellationToken ct = default)
    {
        // DeleteAsync removes only the active token without leaving a consumed marker,
        // so a post-logout replay does not falsely trigger reuse detection.
        await _refreshTokenStore.DeleteAsync(refreshToken, ct);

        _logger.LogInformation("Session revoked via logout.");
    }

    #endregion

    #region Private Methods

    /// <summary>
    /// Creates access + refresh tokens and saves the refresh token to the store.
    /// Pass an existing <paramref name="familyId"/> during rotation to keep the chain;
    /// omit it (or pass <see langword="null"/>) on a new login to start a fresh family.
    /// </summary>
    private async Task<AuthResult> IssueSessionAsync(
        string userId,
        string role,
        CancellationToken ct,
        string? familyId = null)
    {
        var family = familyId ?? Guid.NewGuid().ToString("N");
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

    /// <summary>Returns true if the API key matches the configured dev key (constant-time compare).</summary>
    private bool TryAuthenticateWithApiKey(string? apiKey, out string subject, out string role)
    {
        subject = DevApiKeySubject;
        role = DevApiKeyRole;

        if (string.IsNullOrEmpty(apiKey) || _devApiKeyBytes is null) return false;
        
        int maxKeyLength = 128; 
        if (apiKey.Length > maxKeyLength) return false;

        Span<byte> inputBytes = stackalloc byte[Encoding.UTF8.GetMaxByteCount(apiKey.Length)];
        int written = Encoding.UTF8.GetBytes(apiKey, inputBytes);
    
        return CryptographicOperations.FixedTimeEquals(inputBytes[..written], _devApiKeyBytes);
    }

    private static bool IsDemoLogin(string? username, string? password) =>
        string.Equals(username, DemoUsername, StringComparison.OrdinalIgnoreCase)
        && string.Equals(password, DemoPassword, StringComparison.Ordinal);

    private static string NormalizeEmail(string email) =>
        email.Trim().ToLowerInvariant();

    #endregion
}
