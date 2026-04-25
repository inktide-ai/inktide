using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Application.Models;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Soul.Application.Services;

public sealed class UserProviderCredentialService : IUserProviderCredentialService
{

    private readonly IUserProviderCredentialRepository _repo;
    private readonly IApiKeyProtector _protector;
    private readonly TimeProvider _time;
    private readonly ILogger<UserProviderCredentialService> _logger;


    public UserProviderCredentialService(
        IUserProviderCredentialRepository repo,
        IApiKeyProtector protector,
        TimeProvider time,
        ILogger<UserProviderCredentialService> logger)
    {
        _repo      = repo      ?? throw new ArgumentNullException(nameof(repo));
        _protector = protector ?? throw new ArgumentNullException(nameof(protector));
        _time      = time      ?? throw new ArgumentNullException(nameof(time));
        _logger    = logger    ?? throw new ArgumentNullException(nameof(logger));
    }


    public async Task<IReadOnlyList<UserProviderCredentialSummary>> GetAllAsync(
        Guid userId, CancellationToken ct = default)
    {
        var creds = await _repo.GetByUserIdAsync(userId, ct);
        return creds
            .Select(c => new UserProviderCredentialSummary(c.ProviderId, c.ApiKeyEnc is not null, c.BaseUrl, c.Config, c.UpdatedAt))
            .ToList();
    }

    public async Task UpsertAsync(
        Guid userId, string providerId, string apiKey, string? baseUrl, string? config = null,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(providerId);

        var now          = _time.GetUtcNow().UtcDateTime;
        var encryptedKey = string.IsNullOrWhiteSpace(apiKey) ? null : _protector.Protect(apiKey);

        var existing = await _repo.GetByUserAndProviderAsync(userId, providerId, ct);
        if (existing is not null)
        {
            existing.ApiKeyEnc = encryptedKey;
            existing.BaseUrl   = baseUrl;
            existing.Config    = config;
            existing.UpdatedAt = now;
            await _repo.UpsertAsync(existing, ct);
        }
        else
        {
            var credential = new UserProviderCredential
            {
                Id         = Guid.NewGuid(),
                UserId     = userId,
                ProviderId = providerId,
                ApiKeyEnc  = encryptedKey,
                BaseUrl    = baseUrl,
                Config     = config,
                IsActive   = true,
                CreatedAt  = now,
                UpdatedAt  = now,
            };
            await _repo.UpsertAsync(credential, ct);
        }

        _logger.LogInformation(
            "User {UserId} upserted credential for provider {ProviderId}", userId, providerId);
    }

    public async Task DeleteAsync(Guid userId, string providerId, CancellationToken ct = default)
    {
        await _repo.DeleteAsync(userId, providerId, ct);
        _logger.LogInformation(
            "User {UserId} deleted credential for provider {ProviderId}", userId, providerId);
    }

    public async Task<DecryptedCredential?> GetDecryptedAsync(
        Guid userId, string providerId, CancellationToken ct = default)
    {
        var cred = await _repo.GetByUserAndProviderAsync(userId, providerId, ct);
        if (cred is null || !cred.IsActive) return null;

        if (cred.ApiKeyEnc is null)
            return new DecryptedCredential(string.Empty, cred.BaseUrl, cred.Config);

        try
        {
            var key = _protector.Unprotect(cred.ApiKeyEnc);
            return new DecryptedCredential(key, cred.BaseUrl, cred.Config);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Failed to decrypt credential for user {UserId} provider {ProviderId} — treating as missing",
                userId, providerId);
            return null;
        }
    }

}
