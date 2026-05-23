using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Synapse.Infrastructure.Messaging;

internal sealed class RedisStreamConnectionMonitor(
    IConnectionMultiplexer redis,
    ILogger<RedisStreamConnectionMonitor> logger)
{
    internal async Task WaitForRedisAvailableAsync(CancellationToken ct)
    {
        var delay = TimeSpan.FromSeconds(1);
        var maxDelay = TimeSpan.FromSeconds(30);
        var attempt = 0;
        DateTimeOffset lastWarningUtc = default;
        var warnedOnce = false;

        while (!ct.IsCancellationRequested)
        {
            try
            {
                var db = redis.GetDatabase();
                await db.PingAsync();

                if (attempt > 0)
                    logger.LogInformation(
                        "Redis is reachable again. Synapse ingest consumer resuming. Endpoints: {Endpoints}",
                        FormatEndpoints());

                return;
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch (RedisException ex) when (IsConnectionIssue(ex))
            {
                attempt++;
                var now = DateTimeOffset.UtcNow;
                if (!warnedOnce || (now - lastWarningUtc).TotalSeconds >= 30)
                {
                    lastWarningUtc = now;
                    warnedOnce = true;
                    logger.LogWarning(
                        "Synapse ingest: Redis is not reachable yet ({Reason}). Endpoints: {Endpoints}. " +
                        "Start Redis or fix RedisSettings; retrying with backoff (next wait ~{Delay}s).",
                        GetErrorSummary(ex), FormatEndpoints(), Math.Round(delay.TotalSeconds, 1));
                }

                await Task.Delay(delay, ct);
                delay = TimeSpan.FromMilliseconds(
                    Math.Min(delay.TotalMilliseconds * 1.5, maxDelay.TotalMilliseconds));
            }
        }
    }

    internal string FormatEndpoints()
    {
        try { return string.Join(", ", redis.GetEndPoints().Select(e => e.ToString())); }
        catch { return "(unknown)"; }
    }

    internal static string GetErrorSummary(Exception ex)
    {
        var inner = ex;
        while (inner.InnerException is not null) inner = inner.InnerException;
        return $"{inner.GetType().Name}: {inner.Message}";
    }

    internal static bool IsConnectionIssue(RedisException ex)
    {
        for (var e = (Exception?)ex; e is not null; e = e.InnerException)
        {
            if (e is RedisConnectionException or RedisTimeoutException) return true;
        }
        var msg = ex.Message;
        return msg.Contains("no connection became available", StringComparison.OrdinalIgnoreCase)
            || msg.Contains("UnableToConnect", StringComparison.OrdinalIgnoreCase)
            || msg.Contains("It was not possible to connect", StringComparison.OrdinalIgnoreCase);
    }
}
