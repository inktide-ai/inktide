namespace Chimera.API.Soul.Application.Interfaces;

/// <summary>
/// Called after a new model has been persisted to enforce the active-model limit.
/// OCP: add MultipleModelsRetentionPolicy or TimedExpiryPolicy without touching AiCardModelUploadService.
/// SRP: the "how many models to keep" decision belongs here, not in the upload service.
/// </summary>
public interface IModelRetentionPolicy
{
    Task EnforceAsync(Guid userId, Guid cardId, Guid newModelId, CancellationToken ct = default);
}
