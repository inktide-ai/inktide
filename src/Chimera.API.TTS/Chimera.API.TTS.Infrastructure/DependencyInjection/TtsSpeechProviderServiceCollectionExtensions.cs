using Chimera.API.TTS.Application.Configuration;
using Chimera.API.TTS.Domain.Speech;
using Chimera.API.TTS.Infrastructure.Decorators;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Chimera.API.TTS.Infrastructure.DependencyInjection;

/// <summary>
/// Registers speech (TTS) providers and <see cref="ISpeechProviderRegistry"/>.
/// Decorator chain (outermost → innermost): Caching → Logging → Provider.
/// </summary>
public static class TtsSpeechProviderServiceCollectionExtensions
{
    #region Public Methods

    /// <summary>
    /// Registers <see cref="ISpeechProvider"/> chain (with logging + caching decorators) and <see cref="ISpeechProviderRegistry"/>.
    /// Add concrete providers in <paramref name="configureChain"/>.
    /// </summary>
    public static IServiceCollection AddChimeraSpeechProviders(
        this IServiceCollection services,
        IConfiguration configuration,
        Action<IServiceProvider, IList<ISpeechProvider>>? configureChain = null)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.Configure<TtsProviderOptions>(configuration.GetSection(TtsProviderOptions.SectionName));

        services.AddSingleton<IEnumerable<ISpeechProvider>>(sp =>
        {
            var list = new List<ISpeechProvider>();
            configureChain?.Invoke(sp, list);

            var loggerFactory = sp.GetRequiredService<ILoggerFactory>();
            var cache = sp.GetRequiredService<IMemoryCache>();

            var wrapped = new List<ISpeechProvider>(list.Count);
            foreach (var provider in list)
            {
                // Build decorator chain: Provider → Logging → Caching (outermost)
                ISpeechProvider chain = provider;

                chain = new LoggingSpeechProviderDecorator(
                    chain,
                    loggerFactory.CreateLogger($"SpeechProvider.{chain.Id}"));

                chain = new CachingSpeechProviderDecorator(
                    chain,
                    cache,
                    loggerFactory.CreateLogger<CachingSpeechProviderDecorator>());

                wrapped.Add(chain);
            }

            return wrapped;
        });

        services.AddSingleton<ISpeechProviderRegistry, SpeechProviderRegistry>();

        return services;
    }

    #endregion
}
