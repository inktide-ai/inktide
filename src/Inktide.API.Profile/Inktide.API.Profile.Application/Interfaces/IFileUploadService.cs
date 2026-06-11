namespace Inktide.API.Profile.Application.Interfaces;

public sealed record UploadResult(string Key, long Size);

public interface IFileUploadService
{
    Task<UploadResult> UploadAsync(
        string userPrefix,
        Stream stream,
        string contentType,
        string fileName,
        long fileSize,
        CancellationToken ct = default);
}
