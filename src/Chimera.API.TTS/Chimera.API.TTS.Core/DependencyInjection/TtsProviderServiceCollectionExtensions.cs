using Chimera.API.TTS.Core;
using Chimera.API.TTS.Core.Configuration;
using Chimera.API.TTS.Core.Decorators;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Chimera.API.TTS.Core.DependencyInjection;

/// <summary>
/// Registers speech (TTS) providers and <see cref="ISpeechProviderRegistry"/> (same pattern as chat providers).
/// </summary>
public static class TtsProviderServiceCollectionExtensions
{
    #region Public Methods

    /// <summary>
    /// Registers <see cref="ISpeechProvider"/> chain (with logging decorators) and <see cref="ISpeechProviderRegistry"/>.
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
            var wrapped = new List<ISpeechProvider>(list.Count);
            foreach (var provider in list)
            {
                ISpeechProvider chain = provider;
                chain = new LoggingSpeechProviderDecorator(
                    chain,
                    loggerFactory.CreateLogger($"SpeechProvider.{chain.Id}"));
                wrapped.Add(chain);
            }

            return wrapped;
        });

        services.AddSingleton<ISpeechProviderRegistry, SpeechProviderRegistry>();

        return services;
    }

    #endregion
}
