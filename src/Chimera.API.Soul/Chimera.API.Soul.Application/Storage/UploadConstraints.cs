namespace Chimera.API.Soul.Application.Storage;

/// <summary>
/// Immutable upload constraints for a specific asset type.
/// Construct one static instance per service — no shared mutable state.
/// SRP: validation config changes independently from upload orchestration.
/// OCP: adding a new asset type means a new UploadConstraints instance, not editing existing services.
/// </summary>
public sealed class UploadConstraints
{
    public required long MaxBytes { get; init; }
    public required IReadOnlySet<string> AllowedExtensions { get; init; }
    public required string FallbackFileName { get; init; }

    /// <summary>Returns null when the file is valid; otherwise an error message string.</summary>
    public string? Validate(string fileName, long sizeBytes)
    {
        if (sizeBytes <= 0)
            return "size_bytes must be positive.";

        if (sizeBytes > MaxBytes)
            return $"File too large (max {MaxBytes / 1_048_576} MB).";

        var ext = Path.GetExtension(fileName);
        if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext.ToLowerInvariant()))
            return $"Allowed extensions: {string.Join(", ", AllowedExtensions)}.";

        return null;
    }
}
