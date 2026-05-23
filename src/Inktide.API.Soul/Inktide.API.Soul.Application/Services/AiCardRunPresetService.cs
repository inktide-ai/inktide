using Inktide.API.Core.Ordering;
using Inktide.API.Core.Transactions;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Repositories;

namespace Inktide.API.Soul.Application.Services;

public sealed class AiCardRunPresetService : IAiCardRunPresetService
{

    private readonly IAiCardRepository _cardRepo;
    private readonly IAiCardRunPresetRepository _presetRepo;
    private readonly ITransactionManager _txManager;


    public AiCardRunPresetService(
        IAiCardRepository cardRepo,
        IAiCardRunPresetRepository presetRepo,
        ITransactionManager txManager)
    {
        _cardRepo   = cardRepo   ?? throw new ArgumentNullException(nameof(cardRepo));
        _presetRepo = presetRepo ?? throw new ArgumentNullException(nameof(presetRepo));
        _txManager  = txManager  ?? throw new ArgumentNullException(nameof(txManager));
    }


    public async Task<IReadOnlyList<AiCardRunPreset>?> ListAsync(Guid userId, Guid cardId, CancellationToken ct = default)
    {
        if (!await CardBelongsToUserAsync(userId, cardId, ct)) return null;
        return await _presetRepo.GetAllAsync(userId, cardId, ct).ConfigureAwait(false);
    }

    public async Task<AiCardRunPreset?> GetByIdAsync(Guid userId, Guid cardId, Guid presetId, CancellationToken ct = default)
    {
        return await _presetRepo.GetByIdAsync(userId, cardId, presetId, ct).ConfigureAwait(false);
    }

    public async Task<AiCardRunPreset?> CreateAsync(
        Guid userId,
        Guid cardId,
        string name,
        string? description,
        string? icon,
        string? overrideLlmModelId,
        float? overrideTemperature,
        string? overrideEmotionPresetId,
        string? overrideVoiceProfileId,
        CancellationToken ct = default)
    {
        if (!await CardBelongsToUserAsync(userId, cardId, ct)) return null;

        var sortKeys = await _presetRepo.GetSortKeysAsync(cardId, ct).ConfigureAwait(false);
        var sortKey  = FractionalIndexer.GenerateKeyBetween(
            sortKeys.Count > 0 ? sortKeys[^1].SortKey : null, null);

        var preset = AiCardRunPreset.Create(
            userId, cardId, name, description, icon,
            overrideLlmModelId, overrideTemperature,
            overrideEmotionPresetId, overrideVoiceProfileId,
            sortKey);

        await _presetRepo.AddAsync(preset, ct).ConfigureAwait(false);
        await _txManager.SaveChangesAsync(ct).ConfigureAwait(false);
        return preset;
    }

    public async Task<AiCardRunPreset?> UpdateAsync(
        Guid userId,
        Guid cardId,
        Guid presetId,
        string name,
        string? description,
        string? icon,
        string? overrideLlmModelId,
        float? overrideTemperature,
        string? overrideEmotionPresetId,
        string? overrideVoiceProfileId,
        CancellationToken ct = default)
    {
        var preset = await _presetRepo.GetByIdAsync(userId, cardId, presetId, ct).ConfigureAwait(false);
        if (preset is null) return null;

        preset.Update(name, description, icon,
            overrideLlmModelId, overrideTemperature,
            overrideEmotionPresetId, overrideVoiceProfileId);

        await _presetRepo.UpdateAsync(preset, ct).ConfigureAwait(false);
        await _txManager.SaveChangesAsync(ct).ConfigureAwait(false);
        return preset;
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid cardId, Guid presetId, CancellationToken ct = default)
    {
        var preset = await _presetRepo.GetByIdAsync(userId, cardId, presetId, ct).ConfigureAwait(false);
        if (preset is null) return false;

        await _presetRepo.DeleteAsync(preset, ct).ConfigureAwait(false);
        await _txManager.SaveChangesAsync(ct).ConfigureAwait(false);
        return true;
    }

    public async Task<AiCardRunPreset?> ActivateAsync(Guid userId, Guid cardId, Guid presetId, CancellationToken ct = default)
    {
        var preset = await _presetRepo.GetByIdAsync(userId, cardId, presetId, ct).ConfigureAwait(false);
        if (preset is null) return null;

        // DeactivateAllAsync uses ExecuteUpdateAsync (bypasses change tracker — commits immediately).
        // UpdateAsync stages preset.Activate() in the change tracker.
        // Must be atomic: if CommitTransactionAsync fails, deactivation rolls back too.
        await _txManager.BeginTransactionAsync(ct).ConfigureAwait(false);
        try
        {
            await _presetRepo.DeactivateAllAsync(cardId, presetId, ct).ConfigureAwait(false);
            preset.Activate();
            await _presetRepo.UpdateAsync(preset, ct).ConfigureAwait(false);
            await _txManager.CommitTransactionAsync(ct).ConfigureAwait(false);
        }
        catch
        {
            await _txManager.RollbackAsync(ct).ConfigureAwait(false);
            throw;
        }
        return preset;
    }

    public async Task DeactivateActiveAsync(Guid userId, Guid cardId, CancellationToken ct = default)
    {
        // DeactivateAllAsync uses ExecuteUpdateAsync — commits immediately, no SaveChangesAsync needed.
        await _presetRepo.DeactivateAllAsync(cardId, exceptId: null, ct).ConfigureAwait(false);
    }

    public async Task<AiCardRunPreset?> ReorderAsync(
        Guid userId, Guid cardId, Guid presetId,
        Guid? previousId, Guid? nextId,
        CancellationToken ct = default)
    {
        var preset = await _presetRepo.GetByIdAsync(userId, cardId, presetId, ct).ConfigureAwait(false);
        if (preset is null) return null;

        var sortKeys = await _presetRepo.GetSortKeysAsync(cardId, ct).ConfigureAwait(false);

        string? prevKey = previousId.HasValue
            ? sortKeys.FirstOrDefault(x => x.Id == previousId.Value).SortKey
            : null;
        string? nextKey = nextId.HasValue
            ? sortKeys.FirstOrDefault(x => x.Id == nextId.Value).SortKey
            : null;

        string newKey = FractionalIndexer.GenerateKeyBetween(prevKey, nextKey);

        preset.SetSortKey(newKey);
        await _presetRepo.UpdateAsync(preset, ct).ConfigureAwait(false);
        await _txManager.SaveChangesAsync(ct).ConfigureAwait(false);
        return preset;
    }


    private async Task<bool> CardBelongsToUserAsync(Guid userId, Guid cardId, CancellationToken ct)
    {
        var card = await _cardRepo.GetByIdAsync(cardId, ct).ConfigureAwait(false);
        return card is not null && card.UserId == userId;
    }

}
