namespace Inktide.API.Connector.Discord.Gateway;

/// <summary>
/// In-memory map from Discord guild_id -> CharacterId (AI card id).
/// Used by DiscordConnector to route incoming messages to the correct soul.
/// </summary>
public interface IGuildSoulRegistry
{
    Guid? GetSoulId(string guildId);
    void Register(string guildId, Guid characterId);
    void Unregister(string guildId);
    void BulkLoad(IEnumerable<(string GuildId, Guid CharacterId)> entries);
}
