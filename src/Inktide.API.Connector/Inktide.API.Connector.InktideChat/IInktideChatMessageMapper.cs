using Inktide.API.Connector.Application.Models;

namespace Inktide.API.Connector.InktideChat;

public interface IInktideChatMessageMapper
{
    ChatMessage Map(InktideChatConnector.InboundMessage msg);
}
