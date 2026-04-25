using Microsoft.Extensions.DependencyInjection;
using Polly;
using Polly.Extensions.Http;

namespace Inktide.API.Core.DependencyInjection;

public static class ChatProviderHttpResilienceExtensions
{
    public static IHttpClientBuilder AddInktideHttpResilience(this IHttpClientBuilder builder)
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

    /// <inheritdoc cref="AddInktideHttpResilience"/>
    public static IHttpClientBuilder AddInktideChatProviderHttpResilience(this IHttpClientBuilder builder)
        => AddInktideHttpResilience(builder);

}
