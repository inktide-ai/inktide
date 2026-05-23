namespace Inktide.API.Soul.Application.Interfaces;

/// <summary>
/// Builds a portable .inkt project archive for a given AI card.
/// The result is a JSON file containing the card configuration + graph definition.
/// </summary>
public interface IAiCardExportService
{
    Task<AiCardExportResult?> ExportAsync(Guid userId, Guid cardId, CancellationToken ct = default);
}

/// <summary>
/// The ready-to-serve file produced by <see cref="IAiCardExportService.ExportAsync"/>.
/// Returns null from ExportAsync when the card is not found.
/// </summary>
public sealed record AiCardExportResult(
    string FileName,
    byte[] Content,
    string ContentType);
