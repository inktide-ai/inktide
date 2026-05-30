using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Repositories;
using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Soul.Infrastructure.Repositories;

public sealed class UserProviderCredentialRepository : IUserProviderCredentialRepository
{

    private readonly SoulDbContext _db;


    public UserProviderCredentialRepository(SoulDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }


    public async Task<IReadOnlyList<UserProviderCredential>> GetByUserIdAsync(
        Guid userId, CancellationToken ct = default)
    {
        return await _db.UserProviderCredentials
            .AsNoTracking()
            .Where(c => c.UserId == userId && c.IsActive)
            .ToListAsync(ct);
    }

    public async Task<UserProviderCredential?> GetByUserAndProviderAsync(
        Guid userId, string providerId, CancellationToken ct = default)
    {
        return await _db.UserProviderCredentials
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.UserId == userId && c.ProviderId == providerId, ct);
    }

    public async Task<UserProviderCredential> UpsertAsync(
        UserProviderCredential credential, CancellationToken ct = default)
    {
        var existing = await _db.UserProviderCredentials
            .FirstOrDefaultAsync(c => c.Id == credential.Id, ct);

        if (existing is null)
            _db.UserProviderCredentials.Add(credential);
        else
            _db.Entry(existing).CurrentValues.SetValues(credential);

        return credential;
    }

    public async Task DeleteAsync(Guid userId, string providerId, CancellationToken ct = default)
    {
        var cred = await _db.UserProviderCredentials
            .FirstOrDefaultAsync(c => c.UserId == userId && c.ProviderId == providerId, ct);

        if (cred is not null)
            _db.UserProviderCredentials.Remove(cred);
    }

    public async Task UpdateVerificationAsync(
        Guid userId, string providerId, bool success, string? error, DateTime testedAt,
        CancellationToken ct = default)
    {
        await _db.UserProviderCredentials
            .Where(c => c.UserId == userId && c.ProviderId == providerId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(c => c.VerifiedAt, success ? testedAt : (DateTime?)null)
                .SetProperty(c => c.LastError,  success ? null : error)
                .SetProperty(c => c.UpdatedAt,  testedAt),
                ct);
    }

}
