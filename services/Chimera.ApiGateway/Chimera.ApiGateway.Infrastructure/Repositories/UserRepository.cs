using Microsoft.EntityFrameworkCore;
using Npgsql;
using Chimera.ApiGateway.Application.Exceptions;
using Chimera.ApiGateway.Domain.Entities;
using Chimera.ApiGateway.Domain.Repositories;
using Chimera.ApiGateway.Infrastructure.Persistence;

namespace Chimera.ApiGateway.Infrastructure.Repositories;

/// <summary>
/// User repository implementation.
/// </summary>
public sealed class UserRepository : IUserRepository
{
    private readonly GatewayDbContext _db;

    public UserRepository(GatewayDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<User?> GetByEmailAsync(
        string email,
        CancellationToken ct = default)
    {
        return await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(
                u => u.Email == email.ToLowerInvariant() && u.IsActive,
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
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            PasswordHash = passwordHash,
            DisplayName = displayName,
            Role = "streamer",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
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
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException ex)
    {
        // PostgreSQL SqlState 23505 = unique_violation
        return ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
    }
}
