namespace Inktide.API.Project.Application.Interfaces;

public sealed record ProjectExportResult(string FileName, byte[] ZipContent);

public interface IProjectExportService
{
    /// <summary>Returns null when projectId is not found or does not belong to userId.</summary>
    Task<ProjectExportResult?> ExportAsync(Guid userId, Guid projectId, CancellationToken ct = default);
}
