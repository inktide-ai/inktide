using Microsoft.Extensions.DependencyInjection;
using Polly;
using Polly.Extensions.Http;

namespace Chimera.API.Core.DependencyInjection;

/// <summary>
/// Retries and basic transient error handling on <see cref="System.Net.Http.HttpClient"/> used by Infrastructure providers.
/// Registry / <see cref="IChatProvider"/> stays free of HTTP concerns.
/// </summary>
public static class ChatProviderHttpResilienceExtensions
{
    #region Public Methods

    /// <summary>
    /// Adds a conservative retry policy for transient HTTP failures (5xx, timeouts, 429).
    /// Tune or replace with <c>Microsoft.Extensions.Http.Resilience</c> when you standardize on that stack.
    /// </summary>
    public static IHttpClientBuilder AddChimeraHttpResilience(this IHttpClientBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        return builder.AddPolicyHandler(
            HttpPolicyExtensions
                .HandleTransientHttpError()
                .OrResult(r => (int)r.StatusCode == 429)
                .WaitAndRetryAsync(
                    3,
                    retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt))));
    }

    /// <inheritdoc cref="AddChimeraHttpResilience"/>
    public static IHttpClientBuilder AddChimeraChatProviderHttpResilience(this IHttpClientBuilder builder)
        => AddChimeraHttpResilience(builder);

    #endregion
}
