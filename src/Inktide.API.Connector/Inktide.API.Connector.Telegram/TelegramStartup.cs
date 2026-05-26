using Inktide.API.Connector.Application.OAuth;
using Inktide.API.Connector.Telegram.Services;
using Inktide.API.Connector.Telegram.Settings;
using Inktide.API.Core;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Connector.Telegram;

public sealed class TelegramStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddOptions<TelegramSettings>()
            .BindConfiguration(nameof(TelegramSettings))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddHttpClient<ITelegramBotApiClient, TelegramBotApiClient>();

        services.AddKeyedSingleton<ITokenProtector>(TokenProtectorKeys.Telegram, (sp, _) =>
            new DataProtectionTokenProtector(
                sp.GetRequiredService<IDataProtectionProvider>(),
                "Telegram.BotTokens"));

        services.AddControllers()
            .PartManager.ApplicationParts.Add(
                new AssemblyPart(typeof(TelegramStartup).Assembly));
    }
}
