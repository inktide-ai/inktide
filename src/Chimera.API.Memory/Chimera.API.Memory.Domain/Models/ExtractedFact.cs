namespace Chimera.API.Memory.Domain.Models;

/// <summary>
/// A fact extracted from a conversation turn by the Scribe Python worker.
/// Mirrors the Python <c>ExtractedFact</c> Pydantic model.
/// </summary>
public sealed record ExtractedFact(
    string Text,
    string Type,
    IReadOnlyList<string> Entities,
    double Importance);
