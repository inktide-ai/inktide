using System.Collections.Concurrent;

namespace Inktide.API.Connector.Twitch.Gateway;

public sealed class TwitchChannelRegistry : ITwitchChannelRegistry
{
    private readonly ConcurrentDictionary<string, Guid> _map = new(StringComparer.Ordinal);

    public void Register(string channelLogin, Guid cardId) =>
        _map[Normalize(channelLogin)] = cardId;

    public void Unregister(string channelLogin) =>
        _map.TryRemove(Normalize(channelLogin), out _);

    public Guid? Resolve(string channelLogin) =>
        _map.TryGetValue(Normalize(channelLogin), out var id) ? id : null;

    public IReadOnlyList<string> GetAllChannelLogins() =>
        [.. _map.Keys];

    private static string Normalize(string login) => login.ToLowerInvariant();
}
