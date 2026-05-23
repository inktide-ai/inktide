using Inktide.API.ScreenAwareness.Application.Models;

namespace Inktide.API.ScreenAwareness.Application.Interfaces;

/// <summary>
/// Records billing events after each vision model call.
/// Default implementation logs only; replace with a DB-backed recorder for production billing.
/// Follows the same pattern as <c>ITtsUsageRecorder</c>.
/// </summary>
public interface IVisionUsageRecorder
{
    ValueTask RecordAsync(VisionUsageEvent usageEvent);
}
