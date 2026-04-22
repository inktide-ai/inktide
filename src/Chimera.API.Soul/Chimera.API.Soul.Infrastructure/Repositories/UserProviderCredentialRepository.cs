using Chimera.API.Soul.Domain.Entities;
using Chimera.API.Soul.Domain.Repositories;
using Chimera.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Chimera.API.Soul.Infrastructure.Repositories;

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
            _db.UserProviderCredentials.Update(credential);

        await _db.SaveChangesAsync(ct);
        return credential;
    }

    public async Task DeleteAsync(Guid userId, string providerId, CancellationToken ct = default)
    {
        var cred = await _db.UserProviderCredentials
            .FirstOrDefaultAsync(c => c.UserId == userId && c.ProviderId == providerId, ct);

        if (cred is not null)
        {
            _db.UserProviderCredentials.Remove(cred);
            await _db.SaveChangesAsync(ct);
        }
    }

}
