using Inktide.API.Connector.Application.Interfaces;
using Inktide.API.Connector.Discord.Gateway;
using Inktide.API.Connector.Discord.Settings;
using Discord.WebSocket;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Inktide.API.Connector.Discord;

internal sealed class DiscordMessageHandler : IDiscordMessageHandler
{
    private readonly DiscordSettings _settings;
    private readonly IGuildSoulRegistry _registry;
    private readonly IDiscordMessageMapper _mapper;
    private readonly IStreamMessageHandler _messageHandler;
    private readonly ILogger<DiscordMessageHandler> _logger;

    public DiscordMessageHandler(
        IOptions<DiscordSettings> settings,
        IGuildSoulRegistry registry,
        IDiscordMessageMapper mapper,
        IStreamMessageHandler messageHandler,
        ILogger<DiscordMessageHandler> logger)
    {
        _settings       = settings.Value ?? throw new ArgumentNullException(nameof(settings));
        _registry       = registry       ?? throw new ArgumentNullException(nameof(registry));
        _mapper         = mapper         ?? throw new ArgumentNullException(nameof(mapper));
        _messageHandler = messageHandler ?? throw new ArgumentNullException(nameof(messageHandler));
        _logger         = logger         ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task HandleAsync(SocketMessage rawMessage)
    {
        if (rawMessage is not SocketUserMessage message)
            return;

        if (message.Author.IsBot && _settings.IgnoreBots)
            return;

        if (message.Channel is not SocketTextChannel textChannel)
            return;

        var guildId = textChannel.Guild.Id.ToString();

        var soulId = _registry.GetSoulId(guildId);
        if (soulId is null)
        {
            if (_settings.GuildIds.Count > 0 && !_settings.GuildIds.Contains(textChannel.Guild.Id))
                return;
        }

        if (_settings.ChannelIds.Count > 0 && !_settings.ChannelIds.Contains(textChannel.Id))
            return;

        try
        {
            var chatMessage = _mapper.Map(message, textChannel.Name, guildId);
            if (soulId.HasValue)
                chatMessage = chatMessage with { CharacterId = soulId.Value };
            await _messageHandler.HandleAsync(chatMessage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to handle Discord message from {Author}", message.Author.Username);
        }
    }
}
