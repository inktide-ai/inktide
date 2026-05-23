namespace Inktide.API.Connector.Twitch.Gateway;

public interface ITwitchConnector
{
    bool IsConnected { get; }
    void JoinChannel(string channelLogin);
    void LeaveChannel(string channelLogin);
}
