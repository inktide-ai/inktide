using Chimera.API.Core.Configuration;
using Chimera.API.Core.Decorators;
using Chimera.API.Core.Providers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Chimera.API.Core.DependencyInjection;

/// <summary>
/// Registers chat providers via DI (no manual <c>Register()</c> store): one pass builds <see cref="IChatProviderRegistry"/>.
/// </summary>
public static class ChatProviderServiceCollectionExtensions
{
    #region Public Methods

    /// <summary>
    /// Registers built-in echo provider, optional decorators, and <see cref="IChatProviderRegistry"/>.
    /// Add real providers by registering concrete <see cref="IChatProvider"/> types, then append them in <paramref name="configureChain"/>.
    /// </summary>
    public static IServiceCollection AddChimeraChatProviders(
        this IServiceCollection services,
        IConfiguration configuration,
        Action<IServiceProvider, IList<IChatProvider>>? configureChain = null)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.Configure<ChatProviderOptions>(configuration.GetSection(ChatProviderOptions.SectionName));

        services.AddSingleton<EchoChatProvider>();

        services.AddSingleton<IEnumerable<IChatProvider>>(sp =>
        {
            var list = new List<IChatProvider>
            {
                sp.GetRequiredService<EchoChatProvider>(),
            };

            configureChain?.Invoke(sp, list);

            var loggerFactory = sp.GetRequiredService<ILoggerFactory>();
            var wrapped = new List<IChatProvider>(list.Count);
            foreach (var provider in list)
            {
                IChatProvider chain = provider;
                chain = new MetricsChatProviderDecorator(chain);
                chain = new LoggingChatProviderDecorator(
                    chain,
                    loggerFactory.CreateLogger($"ChatProvider.{chain.Id}"));
                wrapped.Add(chain);
            }

            return wrapped;
        });

        services.AddSingleton<IChatProviderRegistry, ChatProviderRegistry>();

        return services;
    }

    #endregion
}
