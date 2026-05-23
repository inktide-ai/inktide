namespace Inktide.API.ScreenAwareness.Application.Interfaces;

public enum FrameIngestionResult
{
    Queued,
    FeatureDisabled,
    BudgetExceeded,
    DuplicateFrame,
}

/// <summary>
/// Orchestrates the frame ingestion pipeline:
/// feature check → budget → pHash dedup → XADD to <c>screen.frames.pending</c>.
/// </summary>
public interface IFrameIngestionService
{
    Task<FrameIngestionResult> IngestAsync(
        Guid tenantId,
        Guid characterId,
        string sessionId,
        string frameBase64,
        string contentType,
        long capturedAtUnixMs,
        CancellationToken ct = default);
}
