using Inktide.API.Profile.Application.Interfaces;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Soul.Application.Policies;

/// <summary>
/// Enforces "one active model per card" by deleting all other models after a new one is saved.
/// OCP: to allow multiple models, register MultipleModelsRetentionPolicy instead — no service edits needed.
/// SRP: cleanup logic lives here, not inside AiCardModelUploadService.
/// DIP: AiCardModelUploadService depends on IModelRetentionPolicy, not on this concrete class.
/// </summary>
public sealed class SingleActiveModelRetentionPolicy : IModelRetentionPolicy
{
    private readonly IAiCardModelRepository _models;
    private readonly IObjectStorageService _storage;
    private readonly ILogger<SingleActiveModelRetentionPolicy> _logger;

    public SingleActiveModelRetentionPolicy(
        IAiCardModelRepository models,
        IObjectStorageService storage,
        ILogger<SingleActiveModelRetentionPolicy> logger)
    {
        _models  = models   ?? throw new ArgumentNullException(nameof(models));
        _storage = storage  ?? throw new ArgumentNullException(nameof(storage));
        _logger  = logger   ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task EnforceAsync(Guid userId, Guid cardId, Guid newModelId, CancellationToken ct = default)
    {
        var previous = await _models.ListOthersByCardAsync(userId, cardId, newModelId, ct).ConfigureAwait(false);

        foreach (var old in previous)
        {
            if (_storage.IsEnabled)
            {
                try
                {
                    await _storage.DeleteObjectAsync(old.StorageKey, ct).ConfigureAwait(false);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete old model object key={Key}", old.StorageKey);
                }
            }

            await _models.DeleteAsync(old, ct).ConfigureAwait(false);
            _logger.LogInformation("Retention: deleted old ai_card_model id={Id} key={Key}", old.Id, old.StorageKey);
        }
    }
}
