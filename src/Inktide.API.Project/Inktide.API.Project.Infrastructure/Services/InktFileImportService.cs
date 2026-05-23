using System.Text.Json;
using Inktide.API.Core.Contracts;
using Inktide.API.Core.Generators;
using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.Domain.Repositories;
using Inktide.API.Soul.Application.Interfaces;
using Microsoft.Extensions.Caching.Distributed;

namespace Inktide.API.Project.Infrastructure.Services;

internal sealed class InktFileImportService : IInktFileImportService
{
    private static readonly TimeSpan ParseTokenTtl = TimeSpan.FromMinutes(10);

    private readonly IProjectRepository _projectRepo;
    private readonly IAiCardService _cardService;
    private readonly IProjectImportCatalogQuery _catalog;
    private readonly IGraphDefinitionImporter? _graphImporter;
    private readonly IDistributedCache _cache;

    public InktFileImportService(
        IProjectRepository projectRepo,
        IAiCardService cardService,
        IProjectImportCatalogQuery catalog,
        IDistributedCache cache,
        IGraphDefinitionImporter? graphImporter = null)
    {
        _projectRepo   = projectRepo   ?? throw new ArgumentNullException(nameof(projectRepo));
        _cardService   = cardService   ?? throw new ArgumentNullException(nameof(cardService));
        _catalog       = catalog       ?? throw new ArgumentNullException(nameof(catalog));
        _cache         = cache         ?? throw new ArgumentNullException(nameof(cache));
        _graphImporter = graphImporter;
    }

    public async Task<InktFileParseResult> ParseAsync(
        Guid userId,
        Stream inktFileStream,
        CancellationToken ct = default)
    {
        InktArchiveData archive;
        try { archive = InktArchiveParser.Extract(inktFileStream); }
        catch (InvalidOperationException ex) { return Error(ex.Message); }

        var warnings = new List<string>();
        Guid? resolvedLlmId = null;
        Guid? resolvedTtsId = null;

        if (archive.SoulName is not null)
        {
            if (!string.IsNullOrWhiteSpace(archive.SoulLlmModelId))
            {
                var llmEntry = await _catalog.FindLlmByModelIdAsync(archive.SoulLlmModelId, ct).ConfigureAwait(false);
                if (llmEntry is null)
                    warnings.Add($"LLM model '{archive.SoulLlmModelId}' is not available on this platform — a fallback will be used.");
                else
                    resolvedLlmId = llmEntry.Id;
            }

            if (!string.IsNullOrWhiteSpace(archive.SoulTtsVoiceId))
            {
                var ttsEntry = await _catalog.FindTtsByVoiceIdAsync(archive.SoulTtsVoiceId, ct).ConfigureAwait(false);
                if (ttsEntry is null)
                    warnings.Add($"TTS voice '{archive.SoulTtsVoiceId}' is not available on this platform — TTS will be disabled.");
                else
                    resolvedTtsId = ttsEntry.Id;
            }
        }

        warnings.AddRange(FeatureTagWarnings.Resolve(archive.RequiredFeatures));

        var token = IdGenerator.New().ToString("N");
        var context = new InktImportContext(
            UserId:               userId,
            ProjectName:          archive.ProjectName,
            ProjectDesc:          archive.ProjectDesc,
            ProjectPrompt:        archive.ProjectPrompt,
            BrainJson:            archive.BrainJson,
            ResolvedLlmId:        resolvedLlmId,
            ResolvedTtsId:        resolvedTtsId,
            SoulName:             archive.SoulName,
            SoulPersonality:      archive.SoulPersonality,
            SoulSystemPrompt:     archive.SoulSystemPrompt,
            SoulDescription:      archive.SoulDescription,
            SoulStatus:           archive.SoulStatus,
            SoulLlmConfig:        archive.SoulLlmConfig,
            SoulTtsConfig:        archive.SoulTtsConfig,
            SoulAppearance:       archive.SoulAppearance,
            SoulResponseBehavior: archive.SoulResponseBehavior,
            SoulMemorySettings:   archive.SoulMemorySettings,
            SoulAutoPilot:        archive.SoulAutoPilot,
            SoulPersonalityConfig: archive.SoulPersonalityConfig);

        var cacheOpts = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = ParseTokenTtl,
        };
        await _cache.SetStringAsync(
            $"inkt:import:{token}",
            JsonSerializer.Serialize(context),
            cacheOpts,
            ct).ConfigureAwait(false);

        return new InktFileParseResult(
            ProjectName:    archive.ProjectName,
            SoulName:       archive.SoulName,
            HasGraph:       archive.BrainJson is not null,
            ConnectorCount: archive.ConnectorCount,
            LlmModelId:     archive.SoulLlmModelId,
            LlmProvider:    archive.SoulLlmProvider,
            TtsVoiceId:     archive.SoulTtsVoiceId,
            TtsProvider:    archive.SoulTtsProvider,
            Warnings:       warnings,
            Errors:         [],
            ParseToken:     token);
    }

    public async Task<InktFileFinalizeResult> FinalizeAsync(
        Guid userId,
        InktFileFinalizeCommand command,
        CancellationToken ct = default)
    {
        var raw = await _cache.GetStringAsync($"inkt:import:{command.ParseToken}", ct).ConfigureAwait(false);
        if (raw is null)
            throw new InvalidOperationException("Import session expired or not found. Please upload the file again.");

        var context = JsonSerializer.Deserialize<InktImportContext>(raw)
            ?? throw new InvalidOperationException("Import context is corrupted.");

        if (context.UserId != userId)
            throw new UnauthorizedAccessException("Import session does not belong to this user.");

        // 1. Resolve Soul ID.
        Guid? soulId = command.TargetSoulId;

        if (soulId is null && context.SoulName is not null)
        {
            var llmCatalogId = context.ResolvedLlmId;
            if (llmCatalogId is null)
            {
                var firstLlm = await _catalog.GetFirstAvailableLlmAsync(ct).ConfigureAwait(false)
                    ?? throw new InvalidOperationException("No LLM catalog entries are available on this platform.");
                llmCatalogId = firstLlm.Id;
            }

            var cmd = new ImportSoulCommand(
                Name:                 context.SoulName,
                Personality:          context.SoulPersonality      ?? string.Empty,
                SystemPrompt:         context.SoulSystemPrompt     ?? string.Empty,
                Description:          context.SoulDescription      ?? string.Empty,
                Status:               context.SoulStatus           ?? "active",
                LlmCatalogId:         llmCatalogId.Value,
                LlmConfig:            context.SoulLlmConfig        ?? "{}",
                TtsCatalogId:         context.ResolvedTtsId,
                TtsConfig:            context.SoulTtsConfig,
                Appearance:           context.SoulAppearance       ?? "{}",
                ResponseBehavior:     context.SoulResponseBehavior ?? "{}",
                MemorySettings:       context.SoulMemorySettings   ?? "{}",
                AutoPilot:            context.SoulAutoPilot        ?? "{}",
                PersonalityConfigJson: context.SoulPersonalityConfig);

            soulId = await _cardService.CreateFromImportAsync(userId, cmd, ct).ConfigureAwait(false);
        }

        // 2. Create Project.
        var project = ProjectEntity.Create(userId, context.ProjectName, context.ProjectDesc, soulId);
        if (!string.IsNullOrWhiteSpace(context.ProjectPrompt))
            project.SystemPrompt = context.ProjectPrompt;

        await _projectRepo.CreateAsync(project, ct).ConfigureAwait(false);

        // 3. Import graph if present.
        if (context.BrainJson is not null && _graphImporter is not null)
            await _graphImporter.ImportAsync(project.Id, userId, context.BrainJson, ct).ConfigureAwait(false);

        // 4. Remove parse token.
        await _cache.RemoveAsync($"inkt:import:{command.ParseToken}", ct).ConfigureAwait(false);

        return new InktFileFinalizeResult(project.Id, soulId);
    }

    private static InktFileParseResult Error(string message) =>
        new(
            ProjectName:    string.Empty,
            SoulName:       null,
            HasGraph:       false,
            ConnectorCount: 0,
            LlmModelId:     null,
            LlmProvider:    null,
            TtsVoiceId:     null,
            TtsProvider:    null,
            Warnings:       [],
            Errors:         [message],
            ParseToken:     string.Empty);

    private sealed record InktImportContext(
        Guid    UserId,
        string  ProjectName,
        string? ProjectDesc,
        string? ProjectPrompt,
        string? BrainJson,
        Guid?   ResolvedLlmId,
        Guid?   ResolvedTtsId,
        string? SoulName,
        string? SoulPersonality,
        string? SoulSystemPrompt,
        string? SoulDescription,
        string? SoulStatus,
        string? SoulLlmConfig,
        string? SoulTtsConfig,
        string? SoulAppearance,
        string? SoulResponseBehavior,
        string? SoulMemorySettings,
        string? SoulAutoPilot,
        string? SoulPersonalityConfig);
}
