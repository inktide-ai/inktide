namespace Inktide.API.Synapse.Application.Models;

public sealed record SynapseMemoryFact(string Text, float Score, string? Context, DateTimeOffset RecordedAt);
