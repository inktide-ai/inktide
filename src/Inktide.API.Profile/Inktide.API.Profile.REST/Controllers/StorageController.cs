using Inktide.API.Core.Generators;
using System.Security.Claims;
using Inktide.API.Core;
using Inktide.API.Profile.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Profile.REST.Controllers;

/// <summary>
/// S3 / MinIO uploads for testing (objects scoped under <c>users/{userId:N}/</c>, same as avatar ownership checks).
/// </summary>
[ApiController]
[Route("api/storage")]
[Produces("application/json")]
[Authorize]
public sealed class StorageController : ControllerBase
{

    private const long MaxUploadBytes = 52_428_800;

    private readonly IObjectStorageService _storage;
    private readonly IImageProcessingService _imageProcessor;


    public StorageController(IObjectStorageService storage, IImageProcessingService imageProcessor)
    {
        _storage = storage ?? throw new ArgumentNullException(nameof(storage));
        _imageProcessor = imageProcessor ?? throw new ArgumentNullException(nameof(imageProcessor));
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

        var items = new List<ObjectStorageListItem>();
        await foreach (var item in _storage.ListObjectsAsync(prefix, ct).ConfigureAwait(false))
            items.Add(item);
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
            return BadRequest(ApiErrorResponse.From("Query \"key\" is required.", "VALIDATION_ERROR"));

        var prefix = UserObjectPrefix();
        if (prefix is null)
            return Unauthorized();

        if (!key.StartsWith(prefix, StringComparison.Ordinal))
            return Forbid();

        var stream = await _storage.GetObjectAsync(key, ct).ConfigureAwait(false);
        var fileName = key[(key.LastIndexOf('/') + 1)..];
        return File(stream, "application/octet-stream", fileName);
    }

    /// <summary>Upload a file into <c>users/{userId:N}/...</c>.</summary>
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
            return BadRequest(ApiErrorResponse.From("File is required.", "VALIDATION_ERROR"));

        var prefix = UserObjectPrefix();
        if (prefix is null)
            return Unauthorized();

        // Process images: resize 200×200, convert to WebP, strip EXIF
        if (file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            await using var inputStream = file.OpenReadStream();
            var processed = await _imageProcessor.ResizeAvatarAsync(inputStream, ct).ConfigureAwait(false);
            if (processed is not null)
            {
                using (processed)
                {
                    var objectKey = $"{prefix}{IdGenerator.New():N}{processed.Extension}";
                    await _storage.PutObjectAsync(objectKey, processed.Data, processed.ContentType, ct).ConfigureAwait(false);
                    return Ok(new UploadResponse { Key = objectKey, Size = processed.Data.Length });
                }
            }
        }

        // Non-image or unrecognized format: store as-is
        var fallbackExt = FileExtensionMapper.FromContentTypeOrFileName(file.ContentType, file.FileName);
        var fallbackKey = $"{prefix}{IdGenerator.New():N}{fallbackExt}";
        await using (var read = file.OpenReadStream())
        {
            await _storage.PutObjectAsync(fallbackKey, read, file.ContentType, ct).ConfigureAwait(false);
        }
        return Ok(new UploadResponse { Key = fallbackKey, Size = file.Length });
    }


    private string? UserObjectPrefix()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (sub is null || !Guid.TryParse(sub, out var userId))
            return null;
        // Match IUserAvatarService ownership check: users/{userId:N}/ (no dashes).
        return $"users/{userId:N}/";
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
