
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Chimera.Identity.Domain.Entities;
using Chimera.Identity.Domain.Repositories;
using Chimera.Identity.Infrastructure.Persistence;
using Chimera.Identity.Application.Exceptions;

namespace Chimera.Identity.Infrastructure.Repositories;

/// <summary>
/// User repository implementation using TimeProvider for testable timestamps.
/// </summary>
public sealed class UserRepository : IUserRepository
{
    private readonly GatewayDbContext _db;
    private readonly TimeProvider _timeProvider;

    public UserRepository(GatewayDbContext db, TimeProvider timeProvider)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));
    }

    public async Task<User?> GetByEmailAsync(
        string email,
        CancellationToken ct = default)
    {
        // Рекомендую нормализовать email до запроса, чтобы избежать вызова LCase в SQL
        var normalizedEmail = email.ToLowerInvariant();
        
        return await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(
                u => u.Email == normalizedEmail && u.IsActive,
                ct);
    }

    public async Task<User?> GetByIdAsync(
        Guid id,
        CancellationToken ct = default)
    {
        return await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id && u.IsActive, ct);
    }

    public async Task<User> CreateAsync(
        string email,
        string passwordHash,
        string? displayName = null,
        CancellationToken ct = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var now = _timeProvider.GetUtcNow().UtcDateTime;

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            PasswordHash = passwordHash,
            DisplayName = displayName,
            Role = "streamer",
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.Users.Add(user);
        
        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            throw new UniqueConstraintViolationException("Resource already exists.", ex);
        }

        return user;
    }

    public async Task<bool> UpdatePasswordHashAsync(
        Guid userId,
        string newPasswordHash,
        CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, ct);
        if (user is null)
        {
            return false;
        }

        user.PasswordHash = newPasswordHash;
        user.UpdatedAt = _timeProvider.GetUtcNow().UtcDateTime;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException ex)
    {
        return ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
    }
}