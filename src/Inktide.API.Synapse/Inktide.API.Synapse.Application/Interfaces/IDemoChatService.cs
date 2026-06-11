using Inktide.API.Domain.Models;

namespace Inktide.API.Synapse.Application.Interfaces;

public sealed record DemoChatResult(string Text, string? Model);

public interface IDemoChatService
{
    Task<DemoChatResult?> ChatAsync(string text, IReadOnlyList<ChatMessage>? history, CancellationToken ct = default);
}
