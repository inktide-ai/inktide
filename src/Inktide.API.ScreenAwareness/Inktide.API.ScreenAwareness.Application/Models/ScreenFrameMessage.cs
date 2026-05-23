namespace Inktide.API.ScreenAwareness.Application.Models;

/// <summary>
/// Payload published to the <c>screen.frames.pending</c> Redis Stream.
/// Produced by <c>FrameIngestionService</c> after passing feature check, budget, and pHash dedup.
/// </summary>
public sealed record ScreenFrameMessage(
    string TenantId,
    string StreamerId,
    string SessionId,
    string FrameDataBase64,
    string ContentType,
    long CapturedAtUnixMs);
