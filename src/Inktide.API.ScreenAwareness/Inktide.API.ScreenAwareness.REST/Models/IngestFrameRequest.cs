using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace Inktide.API.ScreenAwareness.REST.Models;

/// <summary>
/// Payload for POST /api/screen/frame.
/// Clients should capture at 1 FPS; the server enforces deduplication and budget limits.
/// </summary>
public sealed class IngestFrameRequest
{
    /// <summary>ID of the AI card (character) whose context should receive screen events.</summary>
    [Required]
    [JsonProperty("character_id")]
    public Guid CharacterId { get; set; }

    /// <summary>Opaque client session identifier - used for per-session audit logging.</summary>
    [Required]
    [JsonProperty("session_id")]
    public string SessionId { get; set; } = string.Empty;

    /// <summary>Base64-encoded frame image data (JPEG recommended, max ~300 KB).</summary>
    [Required]
    [JsonProperty("frame_data")]
    public string FrameDataBase64 { get; set; } = string.Empty;

    /// <summary>MIME type of the image (e.g. "image/jpeg").</summary>
    [Required]
    [JsonProperty("content_type")]
    public string ContentType { get; set; } = "image/jpeg";

    /// <summary>Client-side capture timestamp in Unix milliseconds.</summary>
    [JsonProperty("captured_at_unix_ms")]
    public long CapturedAtUnixMs { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
}
