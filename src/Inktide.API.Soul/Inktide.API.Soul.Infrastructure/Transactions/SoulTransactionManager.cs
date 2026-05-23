using System.Data;
using System.Data.Common;
using System.Text.Json;
using Inktide.API.Core.Transactions;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Inktide.API.Soul.Infrastructure.Transactions;

internal sealed class SoulTransactionManager : ITransactionManager, IDisposable, IAsyncDisposable
{
    // Unique constraint names → human-readable field labels for error messages.
    private static readonly Dictionary<string, string> _constraintToFieldMap = new(StringComparer.OrdinalIgnoreCase)
    {
        { "idx_ai_cards_sort",                       "Название карточки" },
        { "idx_ai_cards_user_id",                    "Пользователь" },
        { "idx_ai_card_models_storage_key",          "Файл модели" },
        { "idx_ai_card_channels_active",             "Активный канал карточки" },
        { "idx_ai_card_custom_scene_tags_card_label_norm", "Тег сцены" },
        { "idx_ai_card_run_presets_sort",            "Название пресета" },
    };

    private readonly SoulDbContext _db;
    private readonly IDomainEventCollector _collector;
    private readonly IDomainEventDispatcher _dispatcher;
    private readonly ILogger<SoulTransactionManager> _logger;

    private IDbContextTransaction? _currentTransaction;

    public SoulTransactionManager(
        SoulDbContext db,
        IDomainEventCollector collector,
        IDomainEventDispatcher dispatcher,
        ILogger<SoulTransactionManager> logger)
    {
        _db         = db         ?? throw new ArgumentNullException(nameof(db));
        _collector  = collector  ?? throw new ArgumentNullException(nameof(collector));
        _dispatcher = dispatcher ?? throw new ArgumentNullException(nameof(dispatcher));
        _logger     = logger     ?? throw new ArgumentNullException(nameof(logger));
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
            await FlushEventsAndSaveAsync(ct).ConfigureAwait(false);
            await _currentTransaction.CommitAsync(ct).ConfigureAwait(false);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            _logger.LogError(ex, "Concurrency conflict during commit");
            await TryRollbackAsync(ct).ConfigureAwait(false);
            throw;
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pgEx)
        {
            await TryRollbackAsync(ct).ConfigureAwait(false);
            throw new InvalidOperationException(BuildConstraintMessage(pgEx), ex);
        }
        catch (OperationCanceledException)
        {
            await TryRollbackAsync(ct).ConfigureAwait(false);
            throw;
        }
        finally
        {
            await DisposeTransactionAsync().ConfigureAwait(false);
        }
    }

    public async Task RollbackAsync(CancellationToken ct = default)
    {
        await TryRollbackAsync(ct).ConfigureAwait(false);
        await DisposeTransactionAsync().ConfigureAwait(false);
    }

    // SaveChangesAsync is used outside of explicit Begin/Commit — single atomic unit.
    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        try
        {
            await FlushEventsAndSaveAsync(ct).ConfigureAwait(false);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pgEx)
        {
            throw new InvalidOperationException(BuildConstraintMessage(pgEx), ex);
        }
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

    // ── internals ────────────────────────────────────────────────────────────

    private async Task FlushEventsAndSaveAsync(CancellationToken ct)
    {
        var domainEvents      = _collector.DomainEvents.ToList();
        var integrationEvents = _collector.IntegrationEvents.ToList();
        _collector.Clear();

        foreach (var evt in integrationEvents)
        {
            _db.OutboxEvents.Add(new OutboxEvent
            {
                EventType = evt.GetType().Name,
                Payload   = JsonSerializer.Serialize(evt, evt.GetType()),
            });
        }

        await _db.SaveChangesAsync(ct).ConfigureAwait(false);

        // Domain events may trigger handlers that raise further events — loop until settled.
        while (domainEvents.Count > 0)
        {
            await _dispatcher.DispatchAsync(domainEvents, ct).ConfigureAwait(false);
            domainEvents = [.. _collector.DomainEvents];
            _collector.Clear();
        }
    }

    private async Task TryRollbackAsync(CancellationToken ct)
    {
        if (_currentTransaction is null) return;
        try
        {
            await _currentTransaction.RollbackAsync(ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Rollback failed");
        }
    }

    private async Task DisposeTransactionAsync()
    {
        if (_currentTransaction is null) return;
        await _currentTransaction.DisposeAsync().ConfigureAwait(false);
        _currentTransaction = null;
    }

    private static string BuildConstraintMessage(PostgresException pgEx)
    {
        if (pgEx.ConstraintName is not null &&
            _constraintToFieldMap.TryGetValue(pgEx.ConstraintName, out var field))
            return $"Поле «{field}» должно быть уникальным.";

        return "Нарушение уникальности данных.";
    }
}
