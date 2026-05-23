using Inktide.API.Soul.Application.Exceptions;
using Inktide.API.Soul.Application.Queries;

namespace Inktide.API.Soul.Application.Guards;

/// <summary>
/// Pre-write validation guard for soul creation.
/// Runs AFTER FluentValidation (shape checks) and BEFORE any DB writes.
/// Validates business rules that require DB lookups: catalog existence, API key presence, key validity.
/// </summary>
public sealed class SoulCreationGuard
{
    private readonly SoulCreationValidationQueryService _query;

    public SoulCreationGuard(SoulCreationValidationQueryService query)
    {
        _query = query ?? throw new ArgumentNullException(nameof(query));
    }

    /// <summary>
    /// Validates that the request can proceed to creation.
    /// Throws <see cref="SoulCreationException"/> with a specific error code on any failure.
    /// </summary>
    public async Task EnsureCanCreateAsync(
        Guid userId,
        Guid llmCatalogId,
        string? llmConfigProviderId,
        Guid? ttsCatalogId,
        CancellationToken ct = default)
    {
        var data = await _query.GetValidationDataAsync(userId, llmCatalogId, ttsCatalogId, ct)
                               .ConfigureAwait(false);

        // ── LLM catalog entry ────────────────────────────────────────────────────

        if (data.LlmEntry is null)
            throw new SoulCreationException(
                "CATALOG_NOT_FOUND",
                $"LLM model '{llmCatalogId}' does not exist in the catalog.",
                "llm_catalog_id");

        if (!data.LlmEntry.IsAvailable)
            throw new SoulCreationException(
                "CATALOG_UNAVAILABLE",
                $"LLM model '{data.LlmEntry.DisplayName}' is currently unavailable.",
                "llm_catalog_id");

        // ── Provider consistency ─────────────────────────────────────────────────

        if (llmConfigProviderId is not null
            && !string.Equals(llmConfigProviderId, data.LlmEntry.Provider, StringComparison.OrdinalIgnoreCase))
        {
            throw new SoulCreationException(
                "PROVIDER_MISMATCH",
                $"llm_config.provider_id '{llmConfigProviderId}' does not match " +
                $"the catalog entry's provider '{data.LlmEntry.Provider}'.",
                "llm_config.provider_id");
        }

        // ── LLM API key presence + validity ─────────────────────────────────────

        if (data.LlmEntry.RequiresApiKey)
        {
            if (data.LlmDecryptedCred is null)
                throw new SoulCreationException(
                    "MISSING_API_KEY",
                    $"Provider '{data.LlmEntry.Provider}' requires an API key. " +
                     "Add one in Brain settings before creating a soul.",
                    "llm_catalog_id");

            if (data.LlmCredEntity?.LastError is not null)
                throw new SoulCreationException(
                    "INVALID_API_KEY",
                    $"The API key for '{data.LlmEntry.Provider}' failed validation: {data.LlmCredEntity.LastError} " +
                     "Update it in Brain settings.",
                    "llm_catalog_id");
        }

        // ── TTS catalog entry (optional) ─────────────────────────────────────────

        if (ttsCatalogId.HasValue)
        {
            if (data.TtsEntry is null)
                throw new SoulCreationException(
                    "CATALOG_NOT_FOUND",
                    $"TTS voice '{ttsCatalogId}' does not exist in the catalog.",
                    "tts_catalog_id");

            if (!data.TtsEntry.IsAvailable)
                throw new SoulCreationException(
                    "CATALOG_UNAVAILABLE",
                    $"TTS voice '{data.TtsEntry.DisplayName}' is currently unavailable.",
                    "tts_catalog_id");

            if (data.TtsEntry.RequiresApiKey)
            {
                if (data.TtsDecryptedCred is null)
                    throw new SoulCreationException(
                        "MISSING_API_KEY",
                        $"TTS provider '{data.TtsEntry.Provider}' requires an API key. " +
                         "Add one in Voice settings.",
                        "tts_catalog_id");

                if (data.TtsCredEntity?.LastError is not null)
                    throw new SoulCreationException(
                        "INVALID_API_KEY",
                        $"The API key for TTS provider '{data.TtsEntry.Provider}' failed validation: {data.TtsCredEntity.LastError} " +
                         "Update it in Voice settings.",
                        "tts_catalog_id");
            }
        }
    }
}
