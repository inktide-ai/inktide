namespace Inktide.API.Graph.Domain.Models;

/// <summary>
/// Schema for a single configuration field rendered in the node inspector.
/// FieldType drives the UI control: "string" | "number" | "select" | "bool".
/// </summary>
public sealed record ConfigFieldSchema(
    string FieldType,
    object? Default = null,
    string? Description = null,
    IReadOnlyList<string>? Options = null);
