namespace Inktide.API.ScreenAwareness.Application.Models;

/// <summary>
/// Persisted event record written to the Redis context cache and the per-tenant audit stream.
/// Serialized as JSON in Redis sorted-set members and stream payloads.
/// </summary>
public sealed record ScreenEventRecord(
    string EventId,
    string TenantId,
    string StreamerId,
    string SessionId,
    string EventType,
    float Confidence,
    IReadOnlyDictionary<string, string> Metadata,
    long DetectedAtUnixMs);
