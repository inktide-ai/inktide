namespace Inktide.API.Soul.Application.Storage;

/// <summary>
/// What a card model file may be. Shared by the presigned and the chunked upload flows
/// so both accept exactly the same files.
/// </summary>
public static class ModelUploadConstraints
{
    public static readonly UploadConstraints Value = new()
    {
        MaxBytes           = Constants.SoulConstants.Upload.MaxModelBytes,
        AllowedExtensions  = new HashSet<string> { ".vrm", ".glb", ".gltf", ".zip", ".json" },
        FallbackFileName   = "model.bin",
    };
}
