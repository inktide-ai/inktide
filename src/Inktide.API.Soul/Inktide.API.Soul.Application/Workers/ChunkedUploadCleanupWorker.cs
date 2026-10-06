using Inktide.API.Soul.Application.Constants;
using Inktide.API.Soul.Application.Storage;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Soul.Application.Workers;

/// <summary>Hourly sweep of chunked uploads that were abandoned half way (tab closed, user gave up).</summary>
public sealed class ChunkedUploadCleanupWorker : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

    private readonly ChunkedUploadStore _store;
    private readonly TimeProvider _time;
    private readonly ILogger<ChunkedUploadCleanupWorker> _logger;

    public ChunkedUploadCleanupWorker(
        ChunkedUploadStore store,
        TimeProvider time,
        ILogger<ChunkedUploadCleanupWorker> logger)
    {
        _store  = store  ?? throw new ArgumentNullException(nameof(store));
        _time   = time   ?? throw new ArgumentNullException(nameof(time));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval, _time);
        do
        {
            try
            {
                var removed = _store.DeleteStale(_time.GetUtcNow() - SoulConstants.Upload.UploadSessionTtl);
                if (removed > 0)
                    _logger.LogInformation("Removed {Count} abandoned chunked uploads", removed);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(ex, "Chunked upload cleanup failed");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken).ConfigureAwait(false));
    }
}
