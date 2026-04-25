using System.Security.Claims;
using Inktide.API.Profile.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Profile.REST.Controllers;

/// <summary>
/// S3 / MinIO uploads for testing (objects scoped under <c>users/{sub}/</c>).
/// </summary>
[ApiController]
[Route("api/storage")]
[Produces("application/json")]
[Authorize]
public sealed class StorageController : ControllerBase
{

    private const long MaxUploadBytes = 52_428_800;

    private readonly IObjectStorageService _storage;


    public StorageController(IObjectStorageService storage)
    {
        _storage = storage ?? throw new ArgumentNullException(nameof(storage));
    }


    /// <summary>Whether S3 is configured and the default bucket name.</summary>
    [HttpGet("status")]
    [ProducesResponseType(typeof(StorageStatusResponse), StatusCodes.Status200OK)]
    public IActionResult GetStatus()
    {
        return Ok(new StorageStatusResponse
        {
            Enabled = _storage.IsEnabled,
            Bucket = _storage.DefaultBucket
        });
    }

    /// <summary>List objects under the current user's prefix.</summary>
    [HttpGet("objects")]
    [ProducesResponseType(typeof(IReadOnlyList<ObjectStorageListItem>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> ListObjects(CancellationToken ct)
    {
        if (!_storage.IsEnabled)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = "Object storage is not configured." });

        var prefix = UserObjectPrefix();
        if (prefix is null)
            return Unauthorized();

        var items = await _storage.ListObjectsAsync(prefix, ct).ConfigureAwait(false);
        return Ok(items);
    }

    /// <summary>Download one object (must belong to the current user).</summary>
    [HttpGet("download")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Download([FromQuery] string key, CancellationToken ct)
    {
        if (!_storage.IsEnabled)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = "Object storage is not configured." });

        if (string.IsNullOrWhiteSpace(key))
            return BadRequest(new { message = "Query \"key\" is required." });

        var prefix = UserObjectPrefix();
        if (prefix is null)
            return Unauthorized();

        if (!key.StartsWith(prefix, StringComparison.Ordinal))
            return Forbid();

        var stream = await _storage.GetObjectAsync(key, ct).ConfigureAwait(false);
        var fileName = key[(key.LastIndexOf('/') + 1)..];
        return File(stream, "application/octet-stream", fileName);
    }

    /// <summary>Upload a file into <c>users/{sub}/...</c>.</summary>
    [HttpPost("upload")]
    [RequestSizeLimit(MaxUploadBytes)]
    [ProducesResponseType(typeof(UploadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Upload(IFormFile? file, CancellationToken ct)
    {
        if (!_storage.IsEnabled)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = "Object storage is not configured." });

        if (file is null || file.Length == 0)
            return BadRequest(new { message = "File is required." });

        var prefix = UserObjectPrefix();
        if (prefix is null)
            return Unauthorized();

        var safeName = SanitizeFileName(file.FileName);
        var objectKey = $"{prefix}{Guid.NewGuid():N}_{safeName}";

        await using (var read = file.OpenReadStream())
        {
            await _storage.PutObjectAsync(objectKey, read, file.ContentType, ct).ConfigureAwait(false);
        }

        return Ok(new UploadResponse { Key = objectKey, Size = file.Length });
    }


    private string? UserObjectPrefix()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return sub is null ? null : $"users/{sub}/";
    }

    private static string SanitizeFileName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return "file.bin";

        var leaf = Path.GetFileName(name);
        return string.IsNullOrEmpty(leaf) ? "file.bin" : leaf;
    }


    public sealed class StorageStatusResponse
    {
        public bool Enabled { get; init; }
        public string? Bucket { get; init; }
    }

    public sealed class UploadResponse
    {
        public string Key { get; init; } = string.Empty;
        public long Size { get; init; }
    }

}
