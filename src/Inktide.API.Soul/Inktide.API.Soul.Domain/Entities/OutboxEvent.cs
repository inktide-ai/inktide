using Inktide.API.Core.Generators;
namespace Inktide.API.Soul.Domain.Entities;

/// <summary>
/// Persisted cross-context delivery intent. Written atomically with the originating Soul write;
/// processed asynchronously by OutboxProcessorHostedService.
/// </summary>
public sealed class OutboxEvent
{
    public Guid Id { get; init; } = IdGenerator.New();
    public string EventType { get; init; } = string.Empty;
    public string Payload { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }
    public string? Error { get; set; }
    public int RetryCount { get; set; } = 0;
}
