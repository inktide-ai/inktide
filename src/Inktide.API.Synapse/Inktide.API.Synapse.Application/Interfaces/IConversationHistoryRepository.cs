using Inktide.API.Synapse.Application.Models;

namespace Inktide.API.Synapse.Application.Interfaces;

/// <summary>
/// Per-channel conversation history backed by Redis.
/// Read by <c>SessionScatterShard</c>; written by <c>LlmStreamWorker</c> after each response.
/// </summary>
public interface IConversationHistoryRepository
{
    /// <summary>Returns the last <paramref name="maxTurns"/> turns, oldest first.</summary>
    Task<IReadOnlyList<ConversationTurn>> GetAsync(string channelId, int maxTurns, CancellationToken ct = default);

    /// <summary>
    /// Appends a completed turn and trims the list to <paramref name="maxTurns"/>.
    /// Fire-and-forget safe — never throws.
    /// </summary>
    Task AppendAsync(string channelId, string userMessage, string assistantReply, int maxTurns, CancellationToken ct = default);
}
