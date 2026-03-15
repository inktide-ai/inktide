
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Chimera.API.Identify.Domain.Entities;
using Chimera.API.Identify.Domain.Repositories;
using Chimera.API.Identify.Application.Exceptions;
using Chimera.API.Identify.Infrastructure.DbContext;

namespace Chimera.API.Identify.Infrastructure.Repositories;

/// <summary>
/// User repository implementation using TimeProvider for testable timestamps.
/// </summary>
public sealed class UserRepository : IUserRepository
{
    private readonly IdentifyDbContext _db;
    private readonly TimeProvider _timeProvider;

    public UserRepository(IdentifyDbContext db, TimeProvider timeProvider)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));
    }

    public async Task<User?> GetByEmailAsync(
        string email,
        CancellationToken ct = default)
    {
        var normalizedEmail = email.ToLowerInvariant();
        return await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(
                u => u.Email == normalizedEmail && u.IsActive,
                ct);
    }

    public async Task<User?> GetByGoogleIdAsync(
        string googleId,
        CancellationToken ct = default)
    {
        return await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(
                u => u.GoogleId == googleId && u.IsActive,
                ct);
    }

    public async Task<User?> GetByTwitchIdAsync(
        string twitchId,
        CancellationToken ct = default)
    {
        return await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(
                u => u.TwitchId == twitchId && u.IsActive,
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

    public async Task<bool> LinkGoogleAsync(
        Guid userId,
        string googleId,
        CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, ct);
        if (user is null) return false;

        user.GoogleId = googleId;
        user.UpdatedAt = _timeProvider.GetUtcNow().UtcDateTime;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> LinkTwitchAsync(
        Guid userId,
        string twitchId,
        CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, ct);
        if (user is null) return false;

        user.TwitchId = twitchId;
        user.UpdatedAt = _timeProvider.GetUtcNow().UtcDateTime;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<User> CreateFromOAuthAsync(
        string email,
        string? displayName,
        string passwordHash,
        string? googleId,
        string? twitchId,
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
            GoogleId = googleId,
            TwitchId = twitchId,
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

    private static bool IsUniqueConstraintViolation(DbUpdateException ex)
    {
        return ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
    }
}