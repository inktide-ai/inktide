using System.Threading.Channels;
using Inktide.API.Memory.Application.Configuration;
using Inktide.API.Memory.Application.Interfaces;
using Inktide.API.Memory.Application.Services;
using Inktide.API.Memory.Domain.Models;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Inktide.API.Memory.Application.Workers;

/// <summary>
/// Background service that drains the ingestion channel, batches jobs, and delegates each job
/// to <see cref="IMemoryIngestionPipeline"/> resolved per-scope.
/// Batching strategy: flush when batch reaches <c>IngestionBatchSize</c> OR after <c>IngestionBatchWindowMs</c>.
/// </summary>
public sealed class MemoryIngestionWorker : BackgroundService
{
    private readonly Channel<MemoryIngestionJob> _channel;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IIngestionDlqPublisher _dlq;
    private readonly IOptions<MemoryOptions> _options;
    private readonly ILogger<MemoryIngestionWorker> _logger;

    public MemoryIngestionWorker(
        Channel<MemoryIngestionJob> channel,
        IServiceScopeFactory scopeFactory,
        IIngestionDlqPublisher dlq,
        IOptions<MemoryOptions> options,
        ILogger<MemoryIngestionWorker> logger)
    {
        _channel      = channel      ?? throw new ArgumentNullException(nameof(channel));
        _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
        _dlq          = dlq          ?? throw new ArgumentNullException(nameof(dlq));
        _options      = options      ?? throw new ArgumentNullException(nameof(options));
        _logger       = logger       ?? throw new ArgumentNullException(nameof(logger));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("MemoryIngestionWorker started");

        var opts  = _options.Value;
        var batch = new List<MemoryIngestionJob>(opts.IngestionBatchSize);

        while (!stoppingToken.IsCancellationRequested)
        {
            batch.Clear();

            using var windowCts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
            windowCts.CancelAfter(opts.IngestionBatchWindowMs);

            try
            {
                while (batch.Count < opts.IngestionBatchSize)
                    batch.Add(await _channel.Reader.ReadAsync(windowCts.Token));
            }
            catch (OperationCanceledException) when (!stoppingToken.IsCancellationRequested)
            {
                // batch window expired — flush whatever we have
            }
            catch (OperationCanceledException)
            {
                break; // host is shutting down
            }

            if (batch.Count > 0)
                await ProcessBatchAsync(batch, stoppingToken);
        }

        _logger.LogInformation("MemoryIngestionWorker stopped");
    }

    private async Task ProcessBatchAsync(IReadOnlyList<MemoryIngestionJob> batch, CancellationToken ct)
    {
        foreach (var job in batch)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var pipeline = scope.ServiceProvider.GetRequiredService<IMemoryIngestionPipeline>();
                await pipeline.ProcessAsync(job, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "MemoryIngestionWorker: failed to process job for card {CardId}, channel {Channel}",
                    job.CharacterId, job.ChannelId);
                await _dlq.PublishAsync(job, ex.Message, ct);
            }
        }
    }
}
