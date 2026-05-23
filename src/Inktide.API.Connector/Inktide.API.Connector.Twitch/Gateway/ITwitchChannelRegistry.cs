namespace Inktide.API.Connector.Twitch.Gateway;

public interface ITwitchChannelRegistry
{
    void Register(string channelLogin, Guid cardId);
    void Unregister(string channelLogin);
    Guid? Resolve(string channelLogin);
    IReadOnlyList<string> GetAllChannelLogins();
}
