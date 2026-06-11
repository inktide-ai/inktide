namespace Inktide.API.Core.Contracts;

/// <summary>
/// Cross-context contract: allows Project to create Soul cards during import
/// without a compile-time dependency on Soul.Application.
/// Implemented by Soul.Application (AiCardService).
/// </summary>
public interface IProjectSoulImporter
{
    Task<Guid> CreateFromImportAsync(Guid userId, ImportSoulCommand command, CancellationToken ct = default);
}
