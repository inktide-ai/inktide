using Inktide.API.Core.Configuration;
using Inktide.API.Core.Decorators;
using Inktide.API.Core.Providers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Core.DependencyInjection;

public static class ChatProviderServiceCollectionExtensions
{
    public static IServiceCollection AddInktideChatProviders(
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

}
