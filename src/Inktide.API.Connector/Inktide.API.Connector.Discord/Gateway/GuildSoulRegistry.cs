using System.Collections.Concurrent;

namespace Inktide.API.Connector.Discord.Gateway;

public sealed class GuildSoulRegistry : IGuildSoulRegistry
{
    private readonly ConcurrentDictionary<string, Guid> _map = new(StringComparer.Ordinal);

    public Guid? GetSoulId(string guildId) =>
        _map.TryGetValue(guildId, out var id) ? id : null;

    public void Register(string guildId, Guid characterId) =>
        _map[guildId] = characterId;

    public void Unregister(string guildId) =>
        _map.TryRemove(guildId, out _);

    public void BulkLoad(IEnumerable<(string GuildId, Guid CharacterId)> entries)
    {
        foreach (var (guildId, characterId) in entries)
            _map[guildId] = characterId;
    }
}
