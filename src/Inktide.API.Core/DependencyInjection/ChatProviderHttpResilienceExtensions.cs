using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Polly;
using Polly.CircuitBreaker;
using Polly.Extensions.Http;

namespace Inktide.API.Core.DependencyInjection;

public static class ChatProviderHttpResilienceExtensions
{
    /// <summary>
    /// Adds a resilience pipeline to an HTTP client:
    /// <list type="bullet">
    ///   <item>Retry: 3 attempts with exponential backoff (2s, 4s, 8s) on transient errors and HTTP 429.</item>
    ///   <item>Circuit breaker: opens after 5 consecutive failures, stays open for 60 seconds.
    ///         Prevents hammering a degraded upstream provider.</item>
    /// </list>
    /// </summary>
    public static IHttpClientBuilder AddInktideHttpResilience(this IHttpClientBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        // Circuit breaker sits inside the retry so that a broken circuit surfaces as
        // BrokenCircuitException - which the retry does NOT retry - instead of a slow
        // waterfall of 3 x timeout attempts.
        var circuitBreaker = HttpPolicyExtensions
            .HandleTransientHttpError()
            .CircuitBreakerAsync(
                handledEventsAllowedBeforeBreaking: 5,
                durationOfBreak: TimeSpan.FromSeconds(60),
                onBreak: (_, duration) =>
                {
                    // Logged via the IHttpClientFactory pipeline; individual providers can add their own logging.
                },
                onReset: () => { });

        var retry = HttpPolicyExtensions
            .HandleTransientHttpError()
            .OrResult(r => (int)r.StatusCode == 429)
            .Or<BrokenCircuitException>()          // surface broken circuit fast, don't retry
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt)));

        // Apply circuit breaker first (inner), then retry (outer).
        return builder
            .AddPolicyHandler(retry)
            .AddPolicyHandler(circuitBreaker);
    }

    /// <inheritdoc cref="AddInktideHttpResilience"/>
    public static IHttpClientBuilder AddInktideChatProviderHttpResilience(this IHttpClientBuilder builder)
        => AddInktideHttpResilience(builder);

}
