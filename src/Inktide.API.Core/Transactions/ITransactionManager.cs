using System.Data.Common;

namespace Inktide.API.Core.Transactions;

public interface ITransactionManager
{
    Task SaveChangesAsync(CancellationToken ct = default);
    Task BeginTransactionAsync(CancellationToken ct = default);
    Task CommitTransactionAsync(CancellationToken ct = default);
    Task RollbackAsync(CancellationToken ct = default);
    DbConnection GetDbConnection();
}
