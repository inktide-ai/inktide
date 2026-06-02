using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Billing.Infrastructure.Idempotency;

/// <summary>
/// Ensures a webhook event (identified by <paramref name="doneKey"/>) is processed at most once,
/// using a Redis distributed lock + completion flag.
///
/// The <paramref name="work"/> delegate owns setting the completion flag:
///   await db.StringSetAsync(doneKey, "1", TimeSpan.FromHours(72))
/// Keeping the commit inside <paramref name="work"/> eliminates the gap where a
/// separate CommitAsync() call after an exception would leave the lock released but
/// doneKey unset, causing the event to be re-processed.
/// </summary>
internal static class WebhookIdempotencyGuard
{
    internal static async Task RunOnceAsync(
        IDatabase db,
        string doneKey,
        string lockKey,
        Func<IDatabase, string, CancellationToken, Task> work,
        ILogger logger,
        CancellationToken ct)
    {
        var lockAcquired = false;
        try
        {
            if (await db.KeyExistsAsync(doneKey).WaitAsync(ct).ConfigureAwait(false)) return;

            lockAcquired = await db.StringSetAsync(
                    lockKey, "1", TimeSpan.FromSeconds(30), When.NotExists)
                .WaitAsync(ct).ConfigureAwait(false);

            if (!lockAcquired) return;

            // Double-check: another instance may have completed between KeyExists and lock acquire.
            if (await db.KeyExistsAsync(doneKey).WaitAsync(ct).ConfigureAwait(false)) return;
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Webhook idempotency check failed for key {DoneKey}, refusing to process without dedup", doneKey);
            throw;
        }

        try
        {
            await work(db, doneKey, ct).ConfigureAwait(false);
        }
        finally
        {
            if (lockAcquired)
            {
                try
                {
                    await db.KeyDeleteAsync(lockKey).WaitAsync(ct).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    logger.LogDebug("Webhook lock release skipped (shutdown), key {Key} TTLs in 30s", lockKey);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to release webhook lock {Key}", lockKey);
                }
            }
        }
    }
}
