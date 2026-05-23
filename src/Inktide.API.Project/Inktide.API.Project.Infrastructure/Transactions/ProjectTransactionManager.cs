using System.Data;
using System.Data.Common;
using Inktide.API.Core.Transactions;
using Inktide.API.Project.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Inktide.API.Project.Infrastructure.Transactions;

internal sealed class ProjectTransactionManager : ITransactionManager, IDisposable, IAsyncDisposable
{
    private readonly ProjectDbContext _db;
    private IDbContextTransaction? _currentTransaction;

    public ProjectTransactionManager(ProjectDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task BeginTransactionAsync(CancellationToken ct = default)
    {
        if (_currentTransaction is not null)
            throw new InvalidOperationException("A transaction is already in progress.");
        _currentTransaction = await _db.Database.BeginTransactionAsync(ct).ConfigureAwait(false);
    }

    public async Task CommitTransactionAsync(CancellationToken ct = default)
    {
        if (_currentTransaction is null)
            throw new InvalidOperationException("No active transaction to commit.");
        try
        {
            await _db.SaveChangesAsync(ct).ConfigureAwait(false);
            await _currentTransaction.CommitAsync(ct).ConfigureAwait(false);
        }
        finally
        {
            await DisposeTransactionAsync().ConfigureAwait(false);
        }
    }

    public async Task RollbackAsync(CancellationToken ct = default)
    {
        if (_currentTransaction is null) return;
        try
        {
            await _currentTransaction.RollbackAsync(ct).ConfigureAwait(false);
        }
        finally
        {
            await DisposeTransactionAsync().ConfigureAwait(false);
        }
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
    }

    public DbConnection GetDbConnection()
    {
        var connection = _db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
            connection.Open();
        return connection;
    }

    public void Dispose()
    {
        _currentTransaction?.Dispose();
        _currentTransaction = null;
    }

    public async ValueTask DisposeAsync()
    {
        await DisposeTransactionAsync().ConfigureAwait(false);
    }

    private async Task DisposeTransactionAsync()
    {
        if (_currentTransaction is null) return;
        await _currentTransaction.DisposeAsync().ConfigureAwait(false);
        _currentTransaction = null;
    }
}
