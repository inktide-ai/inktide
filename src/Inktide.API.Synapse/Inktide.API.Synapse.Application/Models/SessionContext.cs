namespace Inktide.API.Synapse.Application.Models;

/// <summary>Output of the Session scatter shard: recent conversation history for this channel.</summary>
public sealed record SessionContext(IReadOnlyList<ConversationTurn> History);
