namespace Inktide.API.Core.Contracts;

/// <summary>
/// Cross-context contract: allows Soul's outbox processor to deliver a graph import
/// to Graph's bounded context without a compile-time dependency on Graph.Infrastructure.
/// Implemented by Graph.Infrastructure, consumed by Soul.Infrastructure's outbox processor.
/// </summary>
public interface IGraphDefinitionImporter
{
    Task ImportAsync(Guid projectId, Guid userId, string graphPayloadJson, CancellationToken ct = default);
}
