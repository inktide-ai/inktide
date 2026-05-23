namespace Inktide.API.ScreenAwareness.Application.Models;

/// <summary>
/// Billing event recorded after each successful vision model call.
/// Follows the same pattern as <c>TtsUsageEvent</c> in the TTS context.
/// </summary>
public sealed record VisionUsageEvent(
    string TenantId,
    string StreamerId,
    int FramesProcessed,
    int EventsDetected,
    int TokensInputUsed,
    decimal CostUsd,
    DateTimeOffset TimestampUtc);
