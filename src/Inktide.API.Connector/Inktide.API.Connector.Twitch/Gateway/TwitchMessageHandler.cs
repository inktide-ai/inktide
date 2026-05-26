using Inktide.API.Connector.Application.Interfaces;
using Microsoft.Extensions.Logging;
using TwitchLib.Client.Events;

namespace Inktide.API.Connector.Twitch.Gateway;

internal sealed class TwitchMessageHandler : ITwitchMessageHandler
{
    private readonly ITwitchChannelRegistry _registry;
    private readonly IStreamMessageHandler _messageHandler;
    private readonly ITwitchMessageMapper _mapper;
    private readonly ILogger<TwitchMessageHandler> _logger;

    public TwitchMessageHandler(
        ITwitchChannelRegistry registry,
        IStreamMessageHandler messageHandler,
        ITwitchMessageMapper mapper,
        ILogger<TwitchMessageHandler> logger)
    {
        _registry       = registry       ?? throw new ArgumentNullException(nameof(registry));
        _messageHandler = messageHandler ?? throw new ArgumentNullException(nameof(messageHandler));
        _mapper         = mapper         ?? throw new ArgumentNullException(nameof(mapper));
        _logger         = logger         ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task HandleAsync(OnMessageReceivedArgs args)
    {
        var channelLogin = args.ChatMessage.Channel.ToLowerInvariant();

        var cardId = _registry.Resolve(channelLogin);
        if (cardId is null)
        {
            _logger.LogDebug("Twitch: no soul mapping for channel #{Channel} — message dropped", channelLogin);
            return;
        }

        var chatMessage = _mapper.Map(args, channelLogin, cardId.Value);

        try
        {
            await _messageHandler.HandleAsync(chatMessage).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Twitch: error handling message from #{Channel}", channelLogin);
        }
    }
}
